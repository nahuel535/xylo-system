from sqlalchemy import Column, Integer, String, Date, DateTime, Numeric, Text, ForeignKey, JSON
from sqlalchemy.sql import func
from sqlalchemy.orm import relationship
from app.db.session import Base


class Quote(Base):
    __tablename__ = "quotes"

    id = Column(Integer, primary_key=True, index=True)
    client_name = Column(String, nullable=False)
    client_phone = Column(String, nullable=True)
    items = Column(JSON, nullable=False, default=list)  # [{description, quantity, unit_price_usd, subtotal_usd}]
    subtotal_usd = Column(Numeric(10, 2), nullable=False, default=0)
    discount_usd = Column(Numeric(10, 2), nullable=False, default=0, server_default="0")
    total_usd = Column(Numeric(10, 2), nullable=False, default=0)
    status = Column(String, nullable=False, default="draft")  # draft | sent | accepted | rejected | expired
    valid_until = Column(Date, nullable=True)
    notes = Column(Text, nullable=True)
    created_by = Column(Integer, ForeignKey("users.id", ondelete="SET NULL"), nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())

    creator = relationship("User", foreign_keys=[created_by])
