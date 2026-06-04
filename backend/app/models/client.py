from sqlalchemy import Column, Integer, String, Boolean, Date, DateTime, Text, ForeignKey, JSON
from sqlalchemy.sql import func
from sqlalchemy.orm import relationship
from app.db.session import Base


class Client(Base):
    __tablename__ = "clients"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, nullable=False)
    phone = Column(String, nullable=True)
    email = Column(String, nullable=True)
    instagram = Column(String, nullable=True)
    source = Column(String, nullable=True)   # venta | referido | instagram | facebook | whatsapp | otro
    status = Column(String, default="lead", nullable=False)  # lead | client | inactive
    tags = Column(JSON, nullable=True)       # list[str]
    notes = Column(Text, nullable=True)
    needs_followup = Column(Boolean, default=False, nullable=False)
    followup_date = Column(Date, nullable=True)
    last_contact_date = Column(Date, nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    interactions = relationship(
        "ClientInteraction",
        back_populates="client",
        cascade="all, delete-orphan",
        order_by="ClientInteraction.date.desc()",
    )


class ClientInteraction(Base):
    __tablename__ = "client_interactions"

    id = Column(Integer, primary_key=True, index=True)
    client_id = Column(Integer, ForeignKey("clients.id", ondelete="CASCADE"), nullable=False)
    type = Column(String, nullable=False)    # llamada | whatsapp | presencial | email | nota
    content = Column(Text, nullable=True)
    date = Column(Date, nullable=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    client = relationship("Client", back_populates="interactions")
