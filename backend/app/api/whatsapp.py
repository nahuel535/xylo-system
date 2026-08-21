import hashlib
import hmac
import json
from datetime import datetime, timezone
from typing import Optional, Tuple

import httpx
from fastapi import APIRouter, Depends, HTTPException, Request
from fastapi.responses import PlainTextResponse
from sqlalchemy.orm import Session, joinedload

from app.core.config import (
    WHATSAPP_ACCESS_TOKEN,
    WHATSAPP_API_VERSION,
    WHATSAPP_APP_SECRET,
    WHATSAPP_PHONE_NUMBER_ID,
    WHATSAPP_VERIFY_TOKEN,
)
from app.core.dependencies import get_current_user
from app.db.session import SessionLocal, get_db
from app.models.client import Client
from app.models.user import User
from app.models.whatsapp import WhatsAppConversation, WhatsAppMessage
from app.schemas.whatsapp import (
    LinkClientRequest,
    SendMessageRequest,
    WhatsAppConversationResponse,
    WhatsAppMessageResponse,
)

router = APIRouter(tags=["WhatsApp"])

GRAPH_BASE_URL = "https://graph.facebook.com"


def _digits(value) -> str:
    return "".join(character for character in str(value or "") if character.isdigit())


def _find_matching_client(db: Session, wa_id: str) -> Optional[Client]:
    """Intenta vincular la conversación con un cliente del CRM comparando
    los últimos 8 dígitos del teléfono (heurística: cubre diferencias de
    código de país / el '9' de celular argentino). Si falla, se puede
    vincular manualmente desde el inbox."""
    wa_digits = _digits(wa_id)
    if len(wa_digits) < 8:
        return None
    wa_suffix = wa_digits[-8:]
    for client in db.query(Client).filter(Client.phone.isnot(None), Client.phone != "").all():
        client_digits = _digits(client.phone)
        if len(client_digits) >= 8 and client_digits[-8:] == wa_suffix:
            return client
    return None


def _get_or_create_conversation(db: Session, wa_id: str, contact_name: Optional[str]) -> WhatsAppConversation:
    conversation = db.query(WhatsAppConversation).filter(WhatsAppConversation.wa_id == wa_id).first()
    if conversation:
        if contact_name and not conversation.contact_name:
            conversation.contact_name = contact_name
        return conversation

    matched_client = _find_matching_client(db, wa_id)
    conversation = WhatsAppConversation(
        wa_id=wa_id,
        contact_name=contact_name,
        client_id=matched_client.id if matched_client else None,
    )
    db.add(conversation)
    db.flush()
    return conversation


def _extract_message_body(message: dict) -> Tuple[str, Optional[str], Optional[str]]:
    """Devuelve (tipo, texto, media_id) según el tipo de mensaje entrante."""
    message_type = message.get("type", "text")
    if message_type == "text":
        return message_type, message.get("text", {}).get("body"), None
    if message_type in ("image", "video", "document", "audio", "sticker"):
        media = message.get(message_type, {})
        return message_type, media.get("caption"), media.get("id")
    if message_type == "location":
        location = message.get("location", {})
        text = f"📍 {location.get('name') or ''} ({location.get('latitude')}, {location.get('longitude')})".strip()
        return message_type, text, None
    return message_type, None, None


def _process_incoming_messages(db: Session, value: dict) -> None:
    messages = value.get("messages")
    if not messages:
        return

    contacts_by_wa_id = {
        contact.get("wa_id"): contact.get("profile", {}).get("name")
        for contact in value.get("contacts", [])
    }

    for message in messages:
        wa_id = message.get("from")
        if not wa_id:
            continue

        wa_message_id = message.get("id")
        if wa_message_id and db.query(WhatsAppMessage).filter(WhatsAppMessage.wa_message_id == wa_message_id).first():
            continue  # Meta puede reenviar el mismo evento; evitamos duplicarlo

        conversation = _get_or_create_conversation(db, wa_id, contacts_by_wa_id.get(wa_id))
        message_type, body, media_id = _extract_message_body(message)

        db.add(WhatsAppMessage(
            conversation_id=conversation.id,
            direction="in",
            wa_message_id=wa_message_id,
            message_type=message_type,
            body=body,
            media_id=media_id,
            status="received",
        ))
        conversation.last_message_at = datetime.now(timezone.utc)
        conversation.last_message_preview = (body or f"[{message_type}]")[:200]
        conversation.unread_count = (conversation.unread_count or 0) + 1
        db.flush()


def _process_message_statuses(db: Session, value: dict) -> None:
    for status_event in value.get("statuses", []):
        wa_message_id = status_event.get("id")
        new_status = status_event.get("status")
        if not wa_message_id or not new_status:
            continue
        message = db.query(WhatsAppMessage).filter(WhatsAppMessage.wa_message_id == wa_message_id).first()
        if message:
            message.status = new_status


@router.get("/webhooks/whatsapp")
def verify_whatsapp_webhook(request: Request):
    mode = request.query_params.get("hub.mode")
    token = request.query_params.get("hub.verify_token")
    challenge = request.query_params.get("hub.challenge")
    if mode == "subscribe" and token == WHATSAPP_VERIFY_TOKEN and challenge:
        return PlainTextResponse(challenge)
    raise HTTPException(status_code=403, detail="Verificación de webhook fallida")


@router.post("/webhooks/whatsapp")
async def receive_whatsapp_webhook(request: Request):
    raw_body = await request.body()

    if WHATSAPP_APP_SECRET:
        signature = request.headers.get("x-hub-signature-256", "")
        expected = "sha256=" + hmac.new(WHATSAPP_APP_SECRET.encode("utf-8"), raw_body, hashlib.sha256).hexdigest()
        if not hmac.compare_digest(signature, expected):
            raise HTTPException(status_code=403, detail="Firma inválida")

    payload = json.loads(raw_body or b"{}")

    db = SessionLocal()
    try:
        for entry in payload.get("entry", []):
            for change in entry.get("changes", []):
                value = change.get("value", {})
                _process_incoming_messages(db, value)
                _process_message_statuses(db, value)
        db.commit()
    finally:
        db.close()

    return {"status": "ok"}


@router.get("/whatsapp/conversations", response_model=list[WhatsAppConversationResponse])
def list_conversations(
    db: Session = Depends(get_db),
    _: User = Depends(get_current_user),
):
    return (
        db.query(WhatsAppConversation)
        .options(joinedload(WhatsAppConversation.client))
        .order_by(WhatsAppConversation.last_message_at.desc().nullslast(), WhatsAppConversation.created_at.desc())
        .all()
    )


@router.get("/whatsapp/conversations/{conversation_id}/messages", response_model=list[WhatsAppMessageResponse])
def get_conversation_messages(
    conversation_id: int,
    db: Session = Depends(get_db),
    _: User = Depends(get_current_user),
):
    conversation = db.query(WhatsAppConversation).filter(WhatsAppConversation.id == conversation_id).first()
    if not conversation:
        raise HTTPException(status_code=404, detail="Conversación no encontrada")

    messages = (
        db.query(WhatsAppMessage)
        .filter(WhatsAppMessage.conversation_id == conversation_id)
        .order_by(WhatsAppMessage.created_at.asc())
        .all()
    )

    if conversation.unread_count:
        conversation.unread_count = 0
        db.commit()

    return messages


@router.post("/whatsapp/conversations/{conversation_id}/messages", response_model=WhatsAppMessageResponse)
def send_whatsapp_message(
    conversation_id: int,
    data: SendMessageRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    if not WHATSAPP_ACCESS_TOKEN or not WHATSAPP_PHONE_NUMBER_ID:
        raise HTTPException(status_code=503, detail="WhatsApp no está configurado en el servidor (faltan variables de entorno)")

    conversation = db.query(WhatsAppConversation).filter(WhatsAppConversation.id == conversation_id).first()
    if not conversation:
        raise HTTPException(status_code=404, detail="Conversación no encontrada")

    body = data.body.strip()
    if not body:
        raise HTTPException(status_code=400, detail="El mensaje no puede estar vacío")

    url = f"{GRAPH_BASE_URL}/{WHATSAPP_API_VERSION}/{WHATSAPP_PHONE_NUMBER_ID}/messages"
    payload = {
        "messaging_product": "whatsapp",
        "to": conversation.wa_id,
        "type": "text",
        "text": {"body": body},
    }
    headers = {"Authorization": f"Bearer {WHATSAPP_ACCESS_TOKEN}"}

    try:
        response = httpx.post(url, json=payload, headers=headers, timeout=15)
        response.raise_for_status()
    except httpx.HTTPStatusError as error:
        try:
            detail = error.response.json().get("error", {}).get("message", "Error al enviar el mensaje")
        except ValueError:
            detail = "Error al enviar el mensaje"
        raise HTTPException(status_code=502, detail=detail) from error
    except httpx.HTTPError as error:
        raise HTTPException(status_code=502, detail="No se pudo conectar con WhatsApp") from error

    wa_message_id = (response.json().get("messages") or [{}])[0].get("id")

    message = WhatsAppMessage(
        conversation_id=conversation.id,
        direction="out",
        wa_message_id=wa_message_id,
        message_type="text",
        body=body,
        status="sent",
        sent_by=current_user.id,
    )
    db.add(message)
    conversation.last_message_at = datetime.now(timezone.utc)
    conversation.last_message_preview = body[:200]
    db.commit()
    db.refresh(message)
    return message


@router.patch("/whatsapp/conversations/{conversation_id}/link-client", response_model=WhatsAppConversationResponse)
def link_conversation_to_client(
    conversation_id: int,
    data: LinkClientRequest,
    db: Session = Depends(get_db),
    _: User = Depends(get_current_user),
):
    conversation = db.query(WhatsAppConversation).filter(WhatsAppConversation.id == conversation_id).first()
    if not conversation:
        raise HTTPException(status_code=404, detail="Conversación no encontrada")

    if data.client_id is not None:
        client = db.query(Client).filter(Client.id == data.client_id).first()
        if not client:
            raise HTTPException(status_code=404, detail="Cliente no encontrado")

    conversation.client_id = data.client_id
    db.commit()
    return (
        db.query(WhatsAppConversation)
        .options(joinedload(WhatsAppConversation.client))
        .filter(WhatsAppConversation.id == conversation_id)
        .first()
    )
