from datetime import date
from decimal import Decimal
import os

import pytest
from fastapi import FastAPI
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from sqlalchemy.pool import StaticPool

# The application creates its default engine while importing routers. Point that
# engine at an isolated database before any application module is loaded; each
# test still overrides get_db with the in-memory session below.
os.environ.setdefault("DATABASE_URL", "sqlite:////tmp/xylo-test-bootstrap.db")
os.environ.setdefault("SECRET_KEY", "test-secret-key")

from app.api.appointments import router as appointments_router
from app.api.admin_activity import router as admin_activity_router
from app.api.after_sales import router as after_sales_router
from app.api.clients import router as clients_router
from app.api.products import router as products_router
from app.api.quotes import router as quotes_router
from app.api.sales import router as sales_router
from app.api.seller_dashboard import router as seller_dashboard_router
from app.api.users import router as users_router
from app.core.security import create_access_token
from app.db.session import Base, get_db
from app.db import base  # noqa: F401 - register core models
from app.models.appointment import Appointment
from app.models.client import Client, ClientInteraction, ClientReminder  # noqa: F401
from app.models.expense import Expense  # noqa: F401
from app.models.product import Product
from app.models.quote import Quote
from app.models.sale import Sale
from app.models.user import User


@pytest.fixture()
def db_session():
    engine = create_engine(
        "sqlite://",
        connect_args={"check_same_thread": False},
        poolclass=StaticPool,
    )
    TestingSession = sessionmaker(autocommit=False, autoflush=False, bind=engine)
    Base.metadata.create_all(bind=engine)
    session = TestingSession()
    try:
        yield session
    finally:
        session.close()
        Base.metadata.drop_all(bind=engine)


@pytest.fixture()
def seeded(db_session):
    admin = User(name="Admin", email="admin@test.com", password_hash="x", role="admin", is_active=True)
    seller_a = User(name="Seller A", email="a@test.com", password_hash="x", role="seller", is_active=True)
    seller_b = User(name="Seller B", email="b@test.com", password_hash="x", role="seller", is_active=True)
    db_session.add_all([admin, seller_a, seller_b])
    db_session.flush()

    product_a = Product(
        category="phone",
        brand="Apple",
        model="iPhone A",
        imei="TEST-A",
        purchase_price_usd=Decimal("100"),
        suggested_sale_price_usd=Decimal("200"),
        warranty_days=20,
        status="sold",
    )
    product_b = Product(
        category="phone",
        brand="Apple",
        model="iPhone B",
        imei="TEST-B",
        purchase_price_usd=Decimal("150"),
        suggested_sale_price_usd=Decimal("250"),
        warranty_days=20,
        status="sold",
    )
    db_session.add_all([product_a, product_b])
    db_session.flush()

    client_a = Client(name="Client A", owner_user_id=seller_a.id, status="lead")
    client_b = Client(name="Client B", owner_user_id=seller_b.id, status="lead")
    db_session.add_all([client_a, client_b])
    db_session.flush()

    appointment_a = Appointment(
        title="Appointment A",
        date=date.today(),
        start_time="10:00",
        status="pending",
        created_by=seller_a.id,
        client_id=client_a.id,
    )
    appointment_b = Appointment(
        title="Appointment B",
        date=date.today(),
        start_time="11:00",
        status="pending",
        created_by=seller_b.id,
        client_id=client_b.id,
    )
    quote_a = Quote(
        client_name="Client A",
        items=[],
        subtotal_usd=0,
        discount_usd=0,
        total_usd=0,
        status="draft",
        created_by=seller_a.id,
    )
    quote_b = Quote(
        client_name="Client B",
        items=[],
        subtotal_usd=0,
        discount_usd=0,
        total_usd=0,
        status="draft",
        created_by=seller_b.id,
    )
    sale_a = Sale(
        product_id=product_a.id,
        seller_id=seller_a.id,
        client_name="Client A",
        sale_price_usd=Decimal("200"),
        purchase_price_usd_snapshot=Decimal("100"),
        gross_profit_usd=Decimal("100"),
        commission_usd=Decimal("10"),
        status="completed",
    )
    sale_b = Sale(
        product_id=product_b.id,
        seller_id=seller_b.id,
        client_name="Client B",
        sale_price_usd=Decimal("250"),
        purchase_price_usd_snapshot=Decimal("150"),
        gross_profit_usd=Decimal("100"),
        commission_usd=Decimal("10"),
        status="completed",
    )
    db_session.add_all([appointment_a, appointment_b, quote_a, quote_b, sale_a, sale_b])
    db_session.commit()

    return {
        "admin": admin,
        "seller_a": seller_a,
        "seller_b": seller_b,
        "client_a": client_a,
        "client_b": client_b,
        "appointment_a": appointment_a,
        "appointment_b": appointment_b,
        "quote_a": quote_a,
        "quote_b": quote_b,
        "sale_a": sale_a,
        "sale_b": sale_b,
        "product_a": product_a,
        "product_b": product_b,
    }


@pytest.fixture()
def app(db_session):
    test_app = FastAPI()
    for router in (
        appointments_router,
        admin_activity_router,
        after_sales_router,
        clients_router,
        products_router,
        quotes_router,
        sales_router,
        seller_dashboard_router,
        users_router,
    ):
        test_app.include_router(router)

    def override_get_db():
        yield db_session

    test_app.dependency_overrides[get_db] = override_get_db
    return test_app


@pytest.fixture()
def client(app):
    return TestClient(app)


def auth_headers(user: User) -> dict[str, str]:
    token = create_access_token({"sub": str(user.id), "role": user.role})
    return {"Authorization": f"Bearer {token}"}
