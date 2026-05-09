from sqlalchemy import Column, Integer, String, Numeric, Text, DateTime, ForeignKey
from sqlalchemy.sql import func
from app.db.session import Base


class Accessory(Base):
    __tablename__ = "accessories"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, nullable=False)
    category = Column(String, nullable=False)
    brand = Column(String, nullable=True)
    quantity = Column(Integer, default=0, nullable=False)
    purchase_price_usd = Column(Numeric(10, 2), default=0, nullable=False)
    sale_price_usd = Column(Numeric(10, 2), default=0, nullable=False)
    supplier = Column(String, nullable=True)
    notes = Column(Text, nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())


class AccessorySale(Base):
    __tablename__ = "accessory_sales"

    id = Column(Integer, primary_key=True, index=True)
    accessory_id = Column(Integer, ForeignKey("accessories.id", ondelete="CASCADE"), nullable=False)
    quantity_sold = Column(Integer, default=1, nullable=False)
    sale_price_usd = Column(Numeric(10, 2), nullable=False)
    purchase_price_usd = Column(Numeric(10, 2), nullable=False)
    gross_profit_usd = Column(Numeric(10, 2), nullable=False)
    notes = Column(Text, nullable=True)
    sold_at = Column(DateTime(timezone=True), server_default=func.now())
