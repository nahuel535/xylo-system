from sqlalchemy import Column, Integer, String, Date, DateTime, Numeric, Text, Boolean
from sqlalchemy.sql import func
from app.db.session import Base


class Debtor(Base):
    __tablename__ = "debtors"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, nullable=False)
    phone = Column(String, nullable=True)
    email = Column(String, nullable=True)
    address = Column(String, nullable=True)
    amount_usd = Column(Numeric(10, 2), nullable=False, default=0)
    due_date = Column(Date, nullable=True)
    description = Column(Text, nullable=True)
    paid = Column(Boolean, default=False, nullable=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())
