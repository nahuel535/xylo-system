from sqlalchemy import Column, Integer, String, Date, DateTime, Numeric, Text
from sqlalchemy.sql import func
from app.db.session import Base


class Expense(Base):
    __tablename__ = "expenses"

    id = Column(Integer, primary_key=True, index=True)
    category = Column(String, nullable=False)   # Ads | Oficina | Vendedores y revendedores | Edicion
    description = Column(Text, nullable=True)
    amount_ars = Column(Numeric(12, 2), nullable=False, default=0)
    amount_usd = Column(Numeric(10, 2), nullable=True)
    date = Column(Date, nullable=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
