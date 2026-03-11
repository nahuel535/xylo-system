from sqlalchemy import Column, Integer, String, DateTime, Numeric, Boolean
from sqlalchemy.sql import func
from app.db.session import Base


class ExchangeRate(Base):
    __tablename__ = "exchange_rates"

    id = Column(Integer, primary_key=True, index=True)

    source_name = Column(String, nullable=True)
    buy_rate_ars = Column(Numeric(10, 2), nullable=False)
    sell_rate_ars = Column(Numeric(10, 2), nullable=False)

    manual_override = Column(Boolean, default=False, nullable=False)
    manual_buy_rate_ars = Column(Numeric(10, 2), nullable=True)
    manual_sell_rate_ars = Column(Numeric(10, 2), nullable=True)

    is_active = Column(Boolean, default=True, nullable=False)

    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())