from pydantic import BaseModel
from datetime import date, datetime
from typing import Optional
from decimal import Decimal


class ExpenseCreate(BaseModel):
    category: str
    description: Optional[str] = None
    amount_ars: Decimal = Decimal("0.00")
    amount_usd: Optional[Decimal] = None
    date: date


class ExpenseUpdate(BaseModel):
    category: str
    description: Optional[str] = None
    amount_ars: Decimal = Decimal("0.00")
    amount_usd: Optional[Decimal] = None
    date: date


class ExpenseResponse(BaseModel):
    id: int
    category: str
    description: Optional[str]
    amount_ars: Decimal
    amount_usd: Optional[Decimal]
    date: date
    created_at: datetime

    class Config:
        from_attributes = True
