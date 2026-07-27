from pydantic import BaseModel
from datetime import date, datetime
from typing import Optional


class AppointmentCreate(BaseModel):
    title: str
    client_id: Optional[int] = None
    contact_name: Optional[str] = None
    contact_phone: Optional[str] = None
    contact_instagram: Optional[str] = None
    description: Optional[str] = None
    date: date
    start_time: str   # "HH:MM"
    end_time: Optional[str] = None
    status: str = "pending"
    notes: Optional[str] = None


class AppointmentUpdate(BaseModel):
    title: Optional[str] = None
    client_id: Optional[int] = None
    contact_name: Optional[str] = None
    contact_phone: Optional[str] = None
    contact_instagram: Optional[str] = None
    description: Optional[str] = None
    date: Optional[date] = None
    start_time: Optional[str] = None
    end_time: Optional[str] = None
    status: Optional[str] = None
    notes: Optional[str] = None


class ClientMinimal(BaseModel):
    id: int
    name: str
    phone: Optional[str]
    instagram: Optional[str]

    class Config:
        from_attributes = True


class AppointmentResponse(BaseModel):
    id: int
    title: str
    client_id: Optional[int]
    client: Optional[ClientMinimal]
    contact_name: Optional[str]
    contact_phone: Optional[str]
    contact_instagram: Optional[str]
    description: Optional[str]
    date: date
    start_time: str
    end_time: Optional[str]
    status: str
    notes: Optional[str]
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True
