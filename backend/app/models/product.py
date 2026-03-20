from sqlalchemy import Column, Integer, String, Date, DateTime, Numeric, Text, ForeignKey, Boolean
from sqlalchemy.sql import func
from app.db.session import Base


class Product(Base):
    __tablename__ = "products"

    id = Column(Integer, primary_key=True, index=True)
    category = Column(String, nullable=False)
    brand = Column(String, nullable=False, default="Apple")
    model = Column(String, nullable=False)
    storage = Column(String, nullable=True)
    color = Column(String, nullable=True)
    imei = Column(String, unique=True, index=True, nullable=False)
    serial_number = Column(String, nullable=True)
    battery_health = Column(Integer, nullable=True)
    cosmetic_condition = Column(String, nullable=True)
    functional_condition = Column(String, nullable=True)
    sim_type = Column(String, nullable=True)
    condition_type = Column(String, nullable=True)  # nuevo / seminuevo
    purchase_date = Column(Date, nullable=True)
    purchase_price_usd = Column(Numeric(10, 2), nullable=False, default=0)
    suggested_sale_price_usd = Column(Numeric(10, 2), nullable=False, default=0)
    supplier = Column(String, nullable=True)
    notes = Column(Text, nullable=True)
    status = Column(String, nullable=False, default="in_stock")
    photo_url = Column(String, nullable=True)
    created_by = Column(Integer, ForeignKey("users.id"), nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())
    qr_code_url = Column(String, nullable=True)
    is_offer = Column(Boolean, default=False, nullable=False, server_default="false")