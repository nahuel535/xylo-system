import asyncio
from datetime import datetime, timezone, timedelta

from fastapi import FastAPI, Depends
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session

from app.db.session import engine, Base, get_db
from app.db.base import User, Product, Sale, SalePayment
from app.api.users import router as users_router
from app.api.products import router as products_router
from app.api.sales import router as sales_router
from app.api.dashboard import router as dashboard_router
from app.api.exchange_rate import router as exchange_rates_router
from app.api.auth import router as auth_router
from app.api.photos import router as photos_router
from app.api.debtors import router as debtors_router
from app.api.expenses import router as expenses_router
from app.api.accessories import router as accessories_router
from app.api.clients import router as clients_router
from app.api.notifications import router as notifications_router
from app.api.appointments import router as appointments_router
from app.api.quotes import router as quotes_router
from app.api.seller_dashboard import router as seller_dashboard_router
from app.api.admin_activity import router as admin_activity_router
from app.api.after_sales import router as after_sales_router
from app.api.whatsapp import router as whatsapp_router
from app.models.expense import Expense  # noqa: ensure table is registered
from app.models.accessory import Accessory, AccessorySale  # noqa: ensure tables are registered
from app.models.client import Client, ClientInteraction  # noqa: ensure tables are registered
from app.models.appointment import Appointment  # noqa: ensure table is registered
from app.models.quote import Quote  # noqa: ensure table is registered
from app.models.seller_payout import SellerPayout  # noqa: ensure table is registered
from app.models.whatsapp import WhatsAppConversation, WhatsAppMessage  # noqa: ensure tables are registered
from app.core.dependencies import require_admin
from app.db.migrations import run_migrations

Base.metadata.create_all(bind=engine)
run_migrations()

app = FastAPI(title="Xylo API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",
        "http://127.0.0.1:5173",
        "https://xylo-system.vercel.app",
        "https://xylobox.online",
        "https://www.xylobox.online",
        "https://xylobox.store",
        "https://www.xylobox.store",
    ],
    allow_origin_regex=r"https://.*(\.vercel\.app|\.railway\.app|\.up\.railway\.app)",
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(users_router)
app.include_router(products_router)
app.include_router(sales_router)
app.include_router(dashboard_router)
app.include_router(exchange_rates_router)
app.include_router(auth_router)
app.include_router(photos_router)
app.include_router(debtors_router)
app.include_router(expenses_router)
app.include_router(accessories_router)
app.include_router(clients_router)
app.include_router(notifications_router)
app.include_router(appointments_router)
app.include_router(quotes_router)
app.include_router(seller_dashboard_router)
app.include_router(admin_activity_router)
app.include_router(after_sales_router)
app.include_router(whatsapp_router)


ARG_TZ = timezone(timedelta(hours=-3))


async def _blue_sync_loop():
    await asyncio.sleep(30)  # espera inicial para que la app arranque
    while True:
        now = datetime.now(ARG_TZ)
        if 9 <= now.hour < 21:
            from app.db.session import SessionLocal
            from app.services.exchange_sync import fetch_and_sync
            db = SessionLocal()
            try:
                await fetch_and_sync(db)
                print(f"✓ Dólar blue sincronizado a las {now.strftime('%H:%M')}")
            except Exception as e:
                print(f"✗ Error sync dólar: {e}")
            finally:
                db.close()
        await asyncio.sleep(3600)  # cada hora


@app.on_event("startup")
async def start_sync_scheduler():
    asyncio.create_task(_blue_sync_loop())


@app.get("/")
def read_root():
    return {"message": "Xylo backend funcionando con PostgreSQL"}


@app.post("/setup")
def setup(
    db: Session = Depends(get_db),
    _: User = Depends(require_admin),
):
    from app.core.security import hash_password
    from app.models.user import User
    existing = db.query(User).filter(User.email == "admin@xylo.com").first()
    if existing:
        return {"message": "Ya existe"}
    user = User(
        name="Admin",
        email="admin@xylo.com",
        password_hash=hash_password("admin123"),
        role="admin",
        is_active=True,
        must_change_password=False,
    )
    db.add(user)
    db.commit()
    return {"message": "Admin creado"}
