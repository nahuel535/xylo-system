from sqlalchemy import Column, Integer, String, DateTime, Numeric, ForeignKey
from sqlalchemy.sql import func
from app.db.session import Base


class SalePayment(Base):
    __tablename__ = "sale_payments"

    id = Column(Integer, primary_key=True, index=True)
    sale_id = Column(Integer, ForeignKey("sales.id"), nullable=False)

    method = Column(String, nullable=False)  # efectivo, transferencia, tarjeta, permuta
    amount_usd = Column(Numeric(10, 2), nullable=False)

    installments = Column(Integer, nullable=True)
    surcharge_usd = Column(Numeric(10, 2), nullable=True)
    commission_usd = Column(Numeric(10, 2), nullable=True)
    reference = Column(String, nullable=True)

    created_at = Column(DateTime(timezone=True), server_default=func.now())