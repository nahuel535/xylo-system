from pydantic import BaseModel
from datetime import date, datetime
from typing import Optional
from decimal import Decimal



class ProductCreate(BaseModel):
    category: str
    brand: str = "Apple"
    model: str
    storage: Optional[str] = None
    color: Optional[str] = None
    imei: str
    serial_number: Optional[str] = None
    battery_health: Optional[int] = None
    cosmetic_condition: Optional[str] = None
    functional_condition: Optional[str] = None
    sim_type: Optional[str] = None
    condition_type: Optional[str] = None
    purchase_date: Optional[date] = None
    purchase_price_usd: Decimal = Decimal("0.00")
    suggested_sale_price_usd: Decimal = Decimal("0.00")
    supplier: Optional[str] = None
    notes: Optional[str] = None
    status: str = "in_stock"
    photo_url: Optional[str] = None
    created_by: Optional[int] = None
    is_offer: bool = False

class ProductUpdate(BaseModel):
    category: str
    brand: str = "Apple"
    model: str
    storage: Optional[str] = None
    color: Optional[str] = None
    imei: str
    serial_number: Optional[str] = None
    battery_health: Optional[int] = None
    cosmetic_condition: Optional[str] = None
    functional_condition: Optional[str] = None
    sim_type: Optional[str] = None
    condition_type: Optional[str] = None
    purchase_date: Optional[date] = None
    purchase_price_usd: Decimal = Decimal("0.00")
    suggested_sale_price_usd: Decimal = Decimal("0.00")
    supplier: Optional[str] = None
    notes: Optional[str] = None
    status: str = "in_stock"
    photo_url: Optional[str] = None
    created_by: Optional[int] = None
    is_offer: bool = False

class ProductResponse(BaseModel):
    id: int
    category: str
    brand: str
    model: str
    storage: Optional[str]
    color: Optional[str]
    imei: str
    serial_number: Optional[str]
    battery_health: Optional[int]
    cosmetic_condition: Optional[str]
    functional_condition: Optional[str]
    sim_type: Optional[str]
    condition_type: Optional[str]
    purchase_date: Optional[date]
    purchase_price_usd: Decimal
    suggested_sale_price_usd: Decimal
    supplier: Optional[str]
    notes: Optional[str]
    status: str
    photo_url: Optional[str]
    created_by: Optional[int]
    created_at: datetime
    updated_at: datetime
    qr_code_url: Optional[str]
    is_offer: bool

    class Config:
        from_attributes = True