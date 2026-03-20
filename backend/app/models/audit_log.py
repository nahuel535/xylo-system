from sqlalchemy import Column, Integer, String, DateTime, JSON, ForeignKey
from sqlalchemy.sql import func
from app.db.session import Base


class AuditLog(Base):
    __tablename__ = "audit_logs"

    id = Column(Integer, primary_key=True, index=True)
    entity_type = Column(String, nullable=False)   # "product" | "sale"
    entity_id = Column(Integer, nullable=False)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=True)
    action = Column(String, nullable=False)        # "created" | "updated" | "sold"
    changes = Column(JSON, nullable=True)          # {"field": {"old": ..., "new": ...}}
    created_at = Column(DateTime(timezone=True), server_default=func.now())
