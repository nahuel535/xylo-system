from datetime import date, datetime
from decimal import Decimal
from typing import Literal, Optional

from pydantic import BaseModel, Field

TICKET_STATUSES = ["recibido", "diagnostico", "reparacion", "listo", "entregado", "cancelado"]


class ServiceTicketCreate(BaseModel):
    client_name: str = Field(min_length=2, max_length=120)
    client_phone: Optional[str] = Field(default=None, max_length=50)
    client_id: Optional[int] = None
    device_brand: Optional[str] = Field(default=None, max_length=60)
    device_model: Optional[str] = Field(default=None, max_length=120)
    device_imei: Optional[str] = Field(default=None, max_length=30)
    product_id: Optional[int] = None
    issue_description: str = Field(min_length=3, max_length=2000)
    assigned_technician_id: Optional[int] = None
    estimated_cost_usd: Optional[Decimal] = Field(default=None, ge=0, max_digits=10, decimal_places=2)
    notes: Optional[str] = Field(default=None, max_length=1000)


class ServiceTicketUpdate(BaseModel):
    status: Optional[Literal[
        "recibido", "diagnostico", "reparacion", "listo", "entregado", "cancelado"
    ]] = None
    diagnosis: Optional[str] = Field(default=None, max_length=2000)
    assigned_technician_id: Optional[int] = None
    estimated_cost_usd: Optional[Decimal] = Field(default=None, ge=0, max_digits=10, decimal_places=2)
    final_cost_usd: Optional[Decimal] = Field(default=None, ge=0, max_digits=10, decimal_places=2)
    parts_used: Optional[str] = Field(default=None, max_length=1000)
    warranty_days: Optional[int] = Field(default=None, ge=0, le=3650)
    notes: Optional[str] = Field(default=None, max_length=1000)


class PartPriceCreate(BaseModel):
    category: str = Field(min_length=2, max_length=60)
    label: str = Field(min_length=1, max_length=120)
    price_usd: Decimal = Field(ge=0, max_digits=10, decimal_places=2)
    notes: Optional[str] = Field(default=None, max_length=500)


class PartPriceUpdate(BaseModel):
    category: Optional[str] = Field(default=None, min_length=2, max_length=60)
    label: Optional[str] = Field(default=None, min_length=1, max_length=120)
    price_usd: Optional[Decimal] = Field(default=None, ge=0, max_digits=10, decimal_places=2)
    notes: Optional[str] = Field(default=None, max_length=500)
