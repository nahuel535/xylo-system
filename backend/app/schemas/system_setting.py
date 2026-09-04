from pydantic import BaseModel, Field
from decimal import Decimal
from datetime import datetime
from typing import Optional


class BaseCommissionResponse(BaseModel):
    amount_usd: Decimal
    updated_at: Optional[datetime] = None


class BaseCommissionUpdate(BaseModel):
    amount_usd: Decimal = Field(gt=0, description="Nueva comisión base por venta, en USD")
