from sqlalchemy import Column, Integer, String, Text, DateTime, ForeignKey
from sqlalchemy.sql import func
from sqlalchemy.orm import relationship
from app.db.session import Base


class WhatsAppConversation(Base):
    __tablename__ = "whatsapp_conversations"

    id = Column(Integer, primary_key=True, index=True)
    wa_id = Column(String, nullable=False, unique=True, index=True)  # número de WhatsApp (sin '+')
    contact_name = Column(String, nullable=True)  # nombre de perfil que manda WhatsApp
    client_id = Column(Integer, ForeignKey("clients.id", ondelete="SET NULL"), nullable=True, index=True)
    last_message_at = Column(DateTime(timezone=True), nullable=True)
    last_message_preview = Column(String, nullable=True)
    unread_count = Column(Integer, default=0, nullable=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    client = relationship("Client", foreign_keys=[client_id])
    messages = relationship(
        "WhatsAppMessage",
        back_populates="conversation",
        cascade="all, delete-orphan",
        order_by="WhatsAppMessage.created_at.asc()",
    )


class WhatsAppMessage(Base):
    __tablename__ = "whatsapp_messages"

    id = Column(Integer, primary_key=True, index=True)
    conversation_id = Column(Integer, ForeignKey("whatsapp_conversations.id", ondelete="CASCADE"), nullable=False, index=True)
    direction = Column(String, nullable=False)  # in | out
    wa_message_id = Column(String, nullable=True, unique=True, index=True)  # id que devuelve Meta
    message_type = Column(String, default="text", nullable=False)  # text | image | document | audio | location | ...
    body = Column(Text, nullable=True)
    media_id = Column(String, nullable=True)  # id de media en Graph API (para descargar después)
    status = Column(String, default="received", nullable=False)  # received | sent | delivered | read | failed
    sent_by = Column(Integer, ForeignKey("users.id", ondelete="SET NULL"), nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    conversation = relationship("WhatsAppConversation", back_populates="messages")
    sender = relationship("User", foreign_keys=[sent_by])
