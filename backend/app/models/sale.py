from sqlalchemy import Column, Integer, String, DateTime, Numeric, Boolean, ForeignKey, Text
from sqlalchemy.sql import func
from app.db.session import Base
from sqlalchemy.orm import relationship

class Sale(Base):
    __tablename__ = "sales"

    id = Column(Integer, primary_key=True, index=True)
    product_id = Column(Integer, ForeignKey("products.id"), nullable=False)
    seller_id = Column(Integer, ForeignKey("users.id"), nullable=False)

    sale_date = Column(DateTime(timezone=True), server_default=func.now())

    sale_price_usd = Column(Numeric(10, 2), nullable=False)
    purchase_price_usd_snapshot = Column(Numeric(10, 2), nullable=False)
    gross_profit_usd = Column(Numeric(10, 2), nullable=False)

    client_name = Column(String, nullable=True)
    notes = Column(Text, nullable=True)

    status = Column(String, nullable=False, default="completed")

    has_trade_in = Column(Boolean, default=False)
    trade_in_value_usd = Column(Numeric(10, 2), nullable=True)

    has_deposit = Column(Boolean, default=False)
    deposit_amount_usd = Column(Numeric(10, 2), nullable=True)
    remaining_balance_usd = Column(Numeric(10, 2), nullable=True)
    
    payments = relationship("SalePayment", backref="sale", cascade="all, delete-orphan")

    created_at = Column(DateTime(timezone=True), server_default=func.now())