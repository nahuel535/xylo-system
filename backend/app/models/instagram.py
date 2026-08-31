from sqlalchemy import Column, Integer, String, Text, DateTime, ForeignKey
from sqlalchemy.sql import func
from sqlalchemy.orm import relationship
from app.db.session import Base


class InstagramConversation(Base):
    __tablename__ = "instagram_conversations"

    id = Column(Integer, primary_key=True, index=True)
    igsid = Column(String, nullable=False, unique=True, index=True)  # Instagram-Scoped ID del contacto
    contact_name = Column(String, nullable=True)  # username / nombre de perfil, si se pudo resolver
    client_id = Column(Integer, ForeignKey("clients.id", ondelete="SET NULL"), nullable=True, index=True)
    last_message_at = Column(DateTime(timezone=True), nullable=True)
    last_message_preview = Column(String, nullable=True)
    unread_count = Column(Integer, default=0, nullable=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    client = relationship("Client", foreign_keys=[client_id])
    messages = relationship(
        "InstagramMessage",
        back_populates="conversation",
        cascade="all, delete-orphan",
        order_by="InstagramMessage.created_at.asc()",
    )


class InstagramMessage(Base):
    __tablename__ = "instagram_messages"

    id = Column(Integer, primary_key=True, index=True)
    conversation_id = Column(Integer, ForeignKey("instagram_conversations.id", ondelete="CASCADE"), nullable=False, index=True)
    direction = Column(String, nullable=False)  # in | out
    ig_message_id = Column(String, nullable=True, unique=True, index=True)  # mid que devuelve Meta
    message_type = Column(String, default="text", nullable=False)  # text | image | story_reply | ...
    body = Column(Text, nullable=True)
    status = Column(String, default="received", nullable=False)  # received | sent | delivered | read | failed
    sent_by = Column(Integer, ForeignKey("users.id", ondelete="SET NULL"), nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    conversation = relationship("InstagramConversation", back_populates="messages")
    sender = relationship("User", foreign_keys=[sent_by])
