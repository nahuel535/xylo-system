from datetime import datetime
from typing import Literal, Optional

from pydantic import BaseModel, Field


class ReservationCreate(BaseModel):
    client_name: str = Field(min_length=2, max_length=120)
    reserved_until: datetime
    notes: Optional[str] = Field(default=None, max_length=500)


class ServiceClaimCreate(BaseModel):
    sale_id: int
    client_phone: Optional[str] = Field(default=None, max_length=50)
    issue: str = Field(min_length=3, max_length=2000)


class ServiceClaimUpdate(BaseModel):
    status: Literal["open", "in_review", "resolved", "rejected"]
    resolution: Optional[str] = Field(default=None, max_length=2000)
