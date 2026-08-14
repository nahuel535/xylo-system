from pydantic import BaseModel, EmailStr, Field, field_validator
from datetime import date, datetime
from decimal import Decimal
from typing import Literal, Optional


class UserCreate(BaseModel):
    name: str = Field(min_length=2, max_length=120)
    email: EmailStr
    password: str = Field(min_length=8, max_length=128)
    role: Literal["admin", "seller"] = "seller"
    commission_rate: Decimal = Field(default=Decimal("0"), ge=0, le=100)

    @field_validator("name")
    @classmethod
    def clean_name(cls, value: str) -> str:
        return " ".join(value.split())


class UserUpdate(BaseModel):
    name: Optional[str] = Field(default=None, min_length=2, max_length=120)
    email: Optional[EmailStr] = None
    role: Optional[Literal["admin", "seller"]] = None
    commission_rate: Optional[Decimal] = Field(default=None, ge=0, le=100)

    @field_validator("name")
    @classmethod
    def clean_name(cls, value: Optional[str]) -> Optional[str]:
        return " ".join(value.split()) if value is not None else value


class UserStatusUpdate(BaseModel):
    is_active: bool


class AdminPasswordReset(BaseModel):
    new_password: str = Field(min_length=8, max_length=128)


class UserResponse(BaseModel):
    id: int
    name: str
    email: EmailStr
    role: str
    is_active: bool
    must_change_password: bool
    is_demo: bool
    commission_rate: Decimal
    created_at: datetime

    class Config:
        from_attributes = True


class CommissionRateUpdate(BaseModel):
    commission_rate: Decimal = Field(ge=0, le=100)


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
    paid_this_month_usd: Decimal
    pending_commission_usd: Decimal


class SellerPayoutCreate(BaseModel):
    seller_id: int
    amount_usd: Decimal = Field(gt=0, max_digits=10, decimal_places=2)
    paid_at: date
    notes: Optional[str] = Field(default=None, max_length=500)


class SellerPayoutUpdate(BaseModel):
    amount_usd: Optional[Decimal] = Field(default=None, gt=0, max_digits=10, decimal_places=2)
    paid_at: Optional[date] = None
    notes: Optional[str] = Field(default=None, max_length=500)


class SellerPayoutResponse(BaseModel):
    id: int
    seller_id: int
    seller_name: str
    amount_usd: Decimal
    paid_at: date
    notes: Optional[str]
    created_by: Optional[int]
    created_by_name: Optional[str]
    created_at: datetime
