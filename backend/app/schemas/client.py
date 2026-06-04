from pydantic import BaseModel
from datetime import date, datetime
from typing import Optional, List


class ClientInteractionCreate(BaseModel):
    type: str
    content: Optional[str] = None
    date: date


class ClientInteractionResponse(BaseModel):
    id: int
    client_id: int
    type: str
    content: Optional[str]
    date: date
    created_at: datetime

    class Config:
        from_attributes = True


class ReminderCreate(BaseModel):
    type: str = "custom"
    due_date: date
    note: Optional[str] = None


class ReminderUpdate(BaseModel):
    status: str  # done | dismissed | pending


class ReminderResponse(BaseModel):
    id: int
    client_id: int
    type: str
    due_date: date
    status: str
    note: Optional[str]
    created_at: datetime

    class Config:
        from_attributes = True


class ReminderWithClientResponse(BaseModel):
    id: int
    client_id: int
    type: str
    due_date: date
    status: str
    note: Optional[str]
    created_at: datetime
    client_name: str
    client_phone: Optional[str]
    client_instagram: Optional[str]
    client_status: str

    class Config:
        from_attributes = True


class ClientCreate(BaseModel):
    name: str
    phone: Optional[str] = None
    email: Optional[str] = None
    instagram: Optional[str] = None
    source: Optional[str] = None
    status: str = "lead"
    tags: Optional[List[str]] = None
    notes: Optional[str] = None
    needs_followup: bool = False
    followup_date: Optional[date] = None


class ClientUpdate(BaseModel):
    name: Optional[str] = None
    phone: Optional[str] = None
    email: Optional[str] = None
    instagram: Optional[str] = None
    source: Optional[str] = None
    status: Optional[str] = None
    tags: Optional[List[str]] = None
    notes: Optional[str] = None
    needs_followup: Optional[bool] = None
    followup_date: Optional[date] = None


class ClientResponse(BaseModel):
    id: int
    name: str
    phone: Optional[str]
    email: Optional[str]
    instagram: Optional[str]
    source: Optional[str]
    status: str
    tags: Optional[List[str]]
    notes: Optional[str]
    needs_followup: bool
    followup_date: Optional[date]
    last_contact_date: Optional[date]
    created_at: datetime
    interactions: List[ClientInteractionResponse] = []
    reminders: List[ReminderResponse] = []

    class Config:
        from_attributes = True
