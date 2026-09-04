from sqlalchemy import Column, Integer, String, Numeric, Text, DateTime, ForeignKey
from sqlalchemy.sql import func
from app.db.session import Base


class TradeInBasePrice(Base):
    __tablename__ = "trade_in_base_prices"

    id = Column(Integer, primary_key=True, index=True)
    model = Column(String, nullable=False, index=True)  # p.ej. "iPhone 13"
    storage = Column(String, nullable=False)  # p.ej. "128GB"
    battery_min = Column(Integer, nullable=False)  # % de batería, límite inferior del rango
    battery_max = Column(Integer, nullable=False)  # % de batería, límite superior del rango
    price_usd = Column(Numeric(10, 2), nullable=False, default=0)
    notes = Column(Text, nullable=True)  # p.ej. "original", o aclaraciones
    updated_by = Column(Integer, ForeignKey("users.id", ondelete="SET NULL"), nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())
