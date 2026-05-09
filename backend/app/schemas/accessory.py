from pydantic import BaseModel
from datetime import datetime
from typing import Optional, List
from decimal import Decimal


class AccessoryCreate(BaseModel):
    name: str
    category: str
    brand: Optional[str] = None
    quantity: int = 0
    purchase_price_usd: Decimal = Decimal("0.00")
    sale_price_usd: Decimal = Decimal("0.00")
    supplier: Optional[str] = None
    notes: Optional[str] = None


class AccessoryUpdate(BaseModel):
    name: str
    category: str
    brand: Optional[str] = None
    purchase_price_usd: Decimal = Decimal("0.00")
    sale_price_usd: Decimal = Decimal("0.00")
    supplier: Optional[str] = None
    notes: Optional[str] = None


class AccessoryResponse(BaseModel):
    id: int
    name: str
    category: str
    brand: Optional[str]
    quantity: int
    purchase_price_usd: Decimal
    sale_price_usd: Decimal
    supplier: Optional[str]
    notes: Optional[str]
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


class AddStockRequest(BaseModel):
    quantity: int
    purchase_price_usd: Optional[Decimal] = None


class SellRequest(BaseModel):
    quantity: int
    sale_price_usd: Optional[Decimal] = None
    sale_id: Optional[int] = None
    notes: Optional[str] = None


class AccessorySaleResponse(BaseModel):
    id: int
    accessory_id: int
    sale_id: Optional[int]
    quantity_sold: int
    sale_price_usd: Decimal
    purchase_price_usd: Decimal
    gross_profit_usd: Decimal
    notes: Optional[str]
    sold_at: datetime

    class Config:
        from_attributes = True


# ── Combos ──────────────────────────────────────────────────────────────────

class ComboItemCreate(BaseModel):
    accessory_id: int
    quantity: int = 1


class ComboCreate(BaseModel):
    name: str
    description: Optional[str] = None
    sale_price_usd: Optional[Decimal] = None
    items: List[ComboItemCreate] = []


class ComboItemResponse(BaseModel):
    id: int
    combo_id: int
    accessory_id: int
    quantity: int

    class Config:
        from_attributes = True


class ComboResponse(BaseModel):
    id: int
    name: str
    description: Optional[str]
    sale_price_usd: Optional[Decimal]
    items: List[ComboItemResponse] = []
    created_at: datetime

    class Config:
        from_attributes = True


class SellComboRequest(BaseModel):
    override_price_usd: Optional[Decimal] = None
    sale_id: Optional[int] = None
    notes: Optional[str] = None
