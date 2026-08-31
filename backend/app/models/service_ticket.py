from sqlalchemy import Column, Integer, String, Text, DateTime, Numeric, Date, ForeignKey
from sqlalchemy.sql import func

from app.db.session import Base


class ServiceTicket(Base):
    __tablename__ = "service_tickets"

    id = Column(Integer, primary_key=True, index=True)

    client_name = Column(String, nullable=False)
    client_phone = Column(String, nullable=True)
    client_id = Column(Integer, ForeignKey("clients.id", ondelete="SET NULL"), nullable=True)

    device_brand = Column(String, nullable=True)
    device_model = Column(String, nullable=True)
    device_imei = Column(String, nullable=True)
    product_id = Column(Integer, ForeignKey("products.id", ondelete="SET NULL"), nullable=True)

    issue_description = Column(Text, nullable=False)
    diagnosis = Column(Text, nullable=True)

    # recibido -> diagnostico -> reparacion -> listo -> entregado (o cancelado)
    status = Column(String, nullable=False, default="recibido")

    assigned_technician_id = Column(Integer, ForeignKey("users.id", ondelete="SET NULL"), nullable=True)

    estimated_cost_usd = Column(Numeric(10, 2), nullable=True)
    final_cost_usd = Column(Numeric(10, 2), nullable=True)
    parts_used = Column(Text, nullable=True)

    warranty_days = Column(Integer, nullable=True)
    warranty_expires_at = Column(Date, nullable=True)

    notes = Column(Text, nullable=True)
    created_by = Column(Integer, ForeignKey("users.id", ondelete="SET NULL"), nullable=True)

    received_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)
    diagnosed_at = Column(DateTime(timezone=True), nullable=True)
    repaired_at = Column(DateTime(timezone=True), nullable=True)
    delivered_at = Column(DateTime(timezone=True), nullable=True)
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())
