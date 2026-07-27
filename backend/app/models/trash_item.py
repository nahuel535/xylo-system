from sqlalchemy import Column, DateTime, ForeignKey, Integer, JSON, String
from sqlalchemy.sql import func

from app.db.session import Base


class TrashItem(Base):
    __tablename__ = "trash_items"

    id = Column(Integer, primary_key=True, index=True)
    entity_type = Column(String, nullable=False, index=True)
    entity_id = Column(Integer, nullable=False)
    label = Column(String, nullable=False)
    payload = Column(JSON, nullable=False)
    deleted_by = Column(Integer, ForeignKey("users.id", ondelete="SET NULL"), nullable=True)
    deleted_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)
