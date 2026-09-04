from pydantic import BaseModel, Field
from decimal import Decimal
from datetime import datetime
from typing import Optional, Dict


class BaseCommissionResponse(BaseModel):
    amount_usd: Decimal
    updated_at: Optional[datetime] = None


class BaseCommissionUpdate(BaseModel):
    amount_usd: Decimal = Field(gt=0, description="Nueva comisión base por venta, en USD")


class CardInstallmentRatesResponse(BaseModel):
    rates: Dict[str, float]  # {"1": 18, "2": 27, ...} -> % de recargo por cantidad de cuotas
    updated_at: Optional[datetime] = None


class CardInstallmentRatesUpdate(BaseModel):
    rates: Dict[str, float]
