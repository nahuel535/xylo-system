from sqlalchemy import Column, Integer, String, Boolean, DateTime, Numeric
from sqlalchemy.sql import func
from app.db.session import Base


class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, nullable=False)
    email = Column(String, unique=True, index=True, nullable=False)
    password_hash = Column(String, nullable=False)
    role = Column(String, nullable=False, default="seller")
    is_active = Column(Boolean, default=True)
    commission_rate = Column(Numeric(5, 2), nullable=False, default=0, server_default="0")
    created_at = Column(DateTime(timezone=True), server_default=func.now())