from pydantic import BaseModel
from datetime import datetime
from typing import Optional


class ClientMinimal(BaseModel):
    id: int
    name: str
    phone: Optional[str] = None

    class Config:
        from_attributes = True


class WhatsAppMessageResponse(BaseModel):
    id: int
    conversation_id: int
    direction: str
    message_type: str
    body: Optional[str] = None
    status: str
    sent_by: Optional[int] = None
    created_at: datetime

    class Config:
        from_attributes = True


class WhatsAppConversationResponse(BaseModel):
    id: int
    wa_id: str
    contact_name: Optional[str] = None
    client_id: Optional[int] = None
    client: Optional[ClientMinimal] = None
    last_message_at: Optional[datetime] = None
    last_message_preview: Optional[str] = None
    unread_count: int
    created_at: datetime

    class Config:
        from_attributes = True


class SendMessageRequest(BaseModel):
    body: str


class LinkClientRequest(BaseModel):
    client_id: Optional[int] = None
