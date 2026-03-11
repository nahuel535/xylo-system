from pydantic import BaseModel
from datetime import datetime
from decimal import Decimal
from typing import Optional


class SalePaymentCreate(BaseModel):
    method: str
    amount_usd: Decimal
    installments: Optional[int] = None
    surcharge_usd: Optional[Decimal] = None
    commission_usd: Optional[Decimal] = None
    reference: Optional[str] = None


class SalePaymentResponse(BaseModel):
    id: int
    sale_id: int
    method: str
    amount_usd: Decimal
    installments: Optional[int]
    surcharge_usd: Optional[Decimal]
    commission_usd: Optional[Decimal]
    reference: Optional[str]
    created_at: datetime

    class Config:
        from_attributes = True