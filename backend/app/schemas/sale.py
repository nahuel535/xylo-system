from pydantic import BaseModel
from datetime import datetime
from decimal import Decimal
from typing import Optional
from typing import Optional, List
from app.schemas.sale_payment import SalePaymentCreate, SalePaymentResponse



class SaleCreate(BaseModel):
    product_id: int
    seller_id: int
    sale_price_usd: Decimal
    client_name: Optional[str] = None
    notes: Optional[str] = None
    has_trade_in: bool = False
    trade_in_value_usd: Optional[Decimal] = None
    has_deposit: bool = False
    deposit_amount_usd: Optional[Decimal] = None
    remaining_balance_usd: Optional[Decimal] = None
    status: str = "completed"
    payments: List[SalePaymentCreate] = []


class SaleResponse(BaseModel):
    id: int
    product_id: int
    seller_id: int
    sale_date: datetime
    sale_price_usd: Decimal
    purchase_price_usd_snapshot: Decimal
    gross_profit_usd: Decimal
    client_name: Optional[str]
    notes: Optional[str]
    status: str
    has_trade_in: bool
    trade_in_value_usd: Optional[Decimal]
    has_deposit: bool
    deposit_amount_usd: Optional[Decimal]
    remaining_balance_usd: Optional[Decimal]
    created_at: datetime
    payments: list[SalePaymentResponse] = []

    class Config:
        from_attributes = True