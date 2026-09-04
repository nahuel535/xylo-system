from pydantic import BaseModel, Field
from decimal import Decimal
from datetime import datetime
from typing import Optional, List


class TradeInBasePriceResponse(BaseModel):
    id: int
    model: str
    storage: str
    battery_min: int
    battery_max: int
    price_usd: Decimal
    notes: Optional[str] = None
    updated_at: Optional[datetime] = None

    class Config:
        from_attributes = True


class TradeInBasePriceCreate(BaseModel):
    model: str
    storage: str
    battery_min: int = Field(ge=0, le=100)
    battery_max: int = Field(ge=0, le=100)
    price_usd: Decimal = Field(ge=0)
    notes: Optional[str] = None


class TradeInBasePriceUpdate(BaseModel):
    model: Optional[str] = None
    storage: Optional[str] = None
    battery_min: Optional[int] = Field(default=None, ge=0, le=100)
    battery_max: Optional[int] = Field(default=None, ge=0, le=100)
    price_usd: Optional[Decimal] = Field(default=None, ge=0)
    notes: Optional[str] = None


class PartDeduction(BaseModel):
    part_price_id: int


class TradeInQuoteRequest(BaseModel):
    model: str
    storage: str
    battery_health: int = Field(ge=0, le=100)
    parts: List[PartDeduction] = []


class PartDeductionDetail(BaseModel):
    part_price_id: int
    category: str
    label: str
    price_usd: Decimal


class TradeInQuoteResponse(BaseModel):
    model: str
    storage: str
    battery_health: int
    base_price_usd: Decimal
    deductions: List[PartDeductionDetail]
    total_deductions_usd: Decimal
    final_price_usd: Decimal
