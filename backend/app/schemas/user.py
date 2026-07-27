from pydantic import BaseModel, EmailStr
from datetime import datetime
from decimal import Decimal
from typing import Literal


class UserCreate(BaseModel):
    name: str
    email: EmailStr
    password: str
    role: Literal["admin", "seller"] = "seller"


class UserResponse(BaseModel):
    id: int
    name: str
    email: EmailStr
    role: str
    is_active: bool
    must_change_password: bool
    commission_rate: Decimal
    created_at: datetime

    class Config:
        from_attributes = True


class CommissionRateUpdate(BaseModel):
    commission_rate: Decimal


class PasswordChange(BaseModel):
    current_password: str
    new_password: str


class SellerCommissionSummary(BaseModel):
    seller_id: int
    seller_name: str
    commission_rate: Decimal
    sales_count: int
    total_sales_usd: Decimal
    total_gross_profit_usd: Decimal
    total_commission_usd: Decimal
