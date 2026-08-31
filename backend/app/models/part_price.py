from sqlalchemy import Column, Integer, String, Numeric, Text, DateTime, ForeignKey
from sqlalchemy.sql import func

from app.db.session import Base


class PartPrice(Base):
    __tablename__ = "part_prices"

    id = Column(Integer, primary_key=True, index=True)
    category = Column(String, nullable=False)  # Batería, Pantalla, Pin de carga, etc.
    label = Column(String, nullable=False)  # p.ej. "iPhone 13"
    price_usd = Column(Numeric(10, 2), nullable=False, default=0)
    notes = Column(Text, nullable=True)
    updated_by = Column(Integer, ForeignKey("users.id", ondelete="SET NULL"), nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())
