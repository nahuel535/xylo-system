from pydantic import BaseModel
from datetime import date, datetime
from typing import Optional
from decimal import Decimal


class DebtorCreate(BaseModel):
    name: str
    phone: Optional[str] = None
    email: Optional[str] = None
    address: Optional[str] = None
    amount_usd: Decimal = Decimal("0.00")
    due_date: Optional[date] = None
    description: Optional[str] = None
    paid: bool = False


class DebtorUpdate(BaseModel):
    name: str
    phone: Optional[str] = None
    email: Optional[str] = None
    address: Optional[str] = None
    amount_usd: Decimal = Decimal("0.00")
    due_date: Optional[date] = None
    description: Optional[str] = None
    paid: bool = False


class DebtorResponse(BaseModel):
    id: int
    name: str
    phone: Optional[str]
    email: Optional[str]
    address: Optional[str]
    amount_usd: Decimal
    due_date: Optional[date]
    description: Optional[str]
    paid: bool
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True
