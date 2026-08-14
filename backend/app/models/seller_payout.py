from sqlalchemy import Column, Date, DateTime, ForeignKey, Integer, Numeric, Text
from sqlalchemy.sql import func

from app.db.session import Base


class SellerPayout(Base):
    __tablename__ = "seller_payouts"

    id = Column(Integer, primary_key=True, index=True)
    seller_id = Column(Integer, ForeignKey("users.id", ondelete="RESTRICT"), nullable=False, index=True)
    amount_usd = Column(Numeric(10, 2), nullable=False)
    paid_at = Column(Date, nullable=False, index=True)
    notes = Column(Text, nullable=True)
    created_by = Column(Integer, ForeignKey("users.id", ondelete="SET NULL"), nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)
