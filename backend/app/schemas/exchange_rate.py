from pydantic import BaseModel
from decimal import Decimal
from datetime import datetime
from typing import Optional


class ExchangeRateBase(BaseModel):
    source_name: Optional[str] = None
    buy_rate_ars: Decimal
    sell_rate_ars: Decimal
    manual_override: bool = False
    manual_buy_rate_ars: Optional[Decimal] = None
    manual_sell_rate_ars: Optional[Decimal] = None
    is_active: bool = True


class ExchangeRateCreate(ExchangeRateBase):
    pass


class ExchangeRateUpdate(BaseModel):
    source_name: Optional[str] = None
    buy_rate_ars: Optional[Decimal] = None
    sell_rate_ars: Optional[Decimal] = None
    manual_override: Optional[bool] = None
    manual_buy_rate_ars: Optional[Decimal] = None
    manual_sell_rate_ars: Optional[Decimal] = None
    is_active: Optional[bool] = None


class ExchangeRateResponse(BaseModel):
    id: int
    source_name: Optional[str]
    buy_rate_ars: Decimal
    sell_rate_ars: Decimal
    manual_override: bool
    manual_buy_rate_ars: Optional[Decimal]
    manual_sell_rate_ars: Optional[Decimal]
    is_active: bool
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


class ActiveExchangeRateResponse(BaseModel):
    source_name: Optional[str]
    buy_rate_ars: Decimal
    sell_rate_ars: Decimal
    mode: str
    updated_at: datetime