from pydantic import BaseModel
from datetime import date, datetime
from decimal import Decimal
from typing import Optional, List


class QuoteItem(BaseModel):
    description: str
    quantity: int = 1
    unit_price_usd: Decimal
    subtotal_usd: Decimal


class QuoteCreate(BaseModel):
    client_name: str
    client_phone: Optional[str] = None
    items: List[QuoteItem]
    discount_usd: Decimal = Decimal("0")
    status: str = "draft"
    valid_until: Optional[date] = None
    notes: Optional[str] = None


class QuoteUpdate(BaseModel):
    client_name: Optional[str] = None
    client_phone: Optional[str] = None
    items: Optional[List[QuoteItem]] = None
    discount_usd: Optional[Decimal] = None
    status: Optional[str] = None
    valid_until: Optional[date] = None
    notes: Optional[str] = None


class QuoteResponse(BaseModel):
    id: int
    client_name: str
    client_phone: Optional[str]
    items: List[dict]
    subtotal_usd: Decimal
    discount_usd: Decimal
    total_usd: Decimal
    status: str
    valid_until: Optional[date]
    notes: Optional[str]
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True
