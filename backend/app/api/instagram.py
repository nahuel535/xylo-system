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
    INSTAGRAM_ACCESS_TOKEN,
    INSTAGRAM_API_VERSION,
    INSTAGRAM_BUSINESS_ACCOUNT_ID,
    INSTAGRAM_VERIFY_TOKEN,
    WHATSAPP_APP_SECRET,  # mismo Meta App que WhatsApp -> mismo App Secret firma ambos webhooks
)
from app.core.dependencies import get_current_user
from app.db.session import SessionLocal, get_db
from app.models.client import Client
from app.models.instagram import InstagramConversation, InstagramMessage
from app.models.user import User
from app.schemas.instagram import (
    LinkClientRequest,
    SendMessageRequest,
    InstagramConversationResponse,
    InstagramMessageResponse,
)

router = APIRouter(tags=["Instagram"])

GRAPH_BASE_URL = "https://graph.facebook.com"


def _normalize_handle(value) -> str:
    return str(value or "").strip().lstrip("@").lower()


def _fetch_igsid_username(igsid: str) -> Optional[str]:
    """Intenta resolver el @usuario de Instagram a partir del IGSID.
    Best-effort: si Meta no lo permite (fuera de ventana, sin permiso, etc.) devuelve None
    sin romper el procesamiento del webhook."""
    if not INSTAGRAM_ACCESS_TOKEN:
        return None
    try:
        response = httpx.get(
            f"{GRAPH_BASE_URL}/{INSTAGRAM_API_VERSION}/{igsid}",
            params={"fields": "username", "access_token": INSTAGRAM_ACCESS_TOKEN},
            timeout=10,
        )
        if response.status_code == 200:
            return response.json().get("username")
    except httpx.HTTPError:
        pass
    return None


def _find_matching_client(db: Session, username: Optional[str]) -> Optional[Client]:
    if not username:
        return None
    handle = _normalize_handle(username)
    if not handle:
        return None
    for client in db.query(Client).filter(Client.instagram.isnot(None), Client.instagram != "").all():
        if _normalize_handle(client.instagram) == handle:
            return client
    return None


def _get_or_create_conversation(db: Session, igsid: str) -> InstagramConversation:
    conversation = db.query(InstagramConversation).filter(InstagramConversation.igsid == igsid).first()
    if conversation:
        return conversation

    username = _fetch_igsid_username(igsid)
    matched_client = _find_matching_client(db, username)
    conversation = InstagramConversation(
        igsid=igsid,
        contact_name=username,
        client_id=matched_client.id if matched_client else None,
    )
    db.add(conversation)
    db.flush()
    return conversation


def _extract_message_body(message: dict) -> Tuple[str, Optional[str]]:
    """Devuelve (tipo, texto) según el contenido del mensaje entrante."""
    if message.get("text"):
        return "text", message["text"]
    attachments = message.get("attachments") or []
    if attachments:
        attachment_type = attachments[0].get("type", "attachment")
        return attachment_type, None
    return "unknown", None


def _process_incoming_messaging(db: Session, entry: dict) -> None:
    for event in entry.get("messaging", []):
        message = event.get("message")
        if not message:
            continue  # eventos que no son mensajes (reads, reactions, etc.) se ignoran por ahora

        if message.get("is_echo"):
            continue  # es un mensaje que mandamos nosotros mismos (por API o desde la app de Instagram)

        igsid = (event.get("sender") or {}).get("id")
        if not igsid:
            continue

        ig_message_id = message.get("mid")
        if ig_message_id and db.query(InstagramMessage).filter(InstagramMessage.ig_message_id == ig_message_id).first():
            continue  # evento duplicado, Meta puede reenviarlo

        conversation = _get_or_create_conversation(db, igsid)
        message_type, body = _extract_message_body(message)

        db.add(InstagramMessage(
            conversation_id=conversation.id,
            direction="in",
            ig_message_id=ig_message_id,
            message_type=message_type,
            body=body,
            status="received",
        ))
        conversation.last_message_at = datetime.now(timezone.utc)
        conversation.last_message_preview = (body or f"[{message_type}]")[:200]
        conversation.unread_count = (conversation.unread_count or 0) + 1
        db.flush()


@router.get("/webhooks/instagram")
def verify_instagram_webhook(request: Request):
    mode = request.query_params.get("hub.mode")
    token = request.query_params.get("hub.verify_token")
    challenge = request.query_params.get("hub.challenge")
    if mode == "subscribe" and token == INSTAGRAM_VERIFY_TOKEN and challenge:
        return PlainTextResponse(challenge)
    raise HTTPException(status_code=403, detail="Verificación de webhook fallida")


@router.post("/webhooks/instagram")
async def receive_instagram_webhook(request: Request):
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
            _process_incoming_messaging(db, entry)
        db.commit()
    finally:
        db.close()

    return {"status": "ok"}


@router.get("/instagram/conversations", response_model=list[InstagramConversationResponse])
def list_conversations(
    db: Session = Depends(get_db),
    _: User = Depends(get_current_user),
):
    return (
        db.query(InstagramConversation)
        .options(joinedload(InstagramConversation.client))
        .order_by(InstagramConversation.last_message_at.desc().nullslast(), InstagramConversation.created_at.desc())
        .all()
    )


@router.get("/instagram/conversations/{conversation_id}/messages", response_model=list[InstagramMessageResponse])
def get_conversation_messages(
    conversation_id: int,
    db: Session = Depends(get_db),
    _: User = Depends(get_current_user),
):
    conversation = db.query(InstagramConversation).filter(InstagramConversation.id == conversation_id).first()
    if not conversation:
        raise HTTPException(status_code=404, detail="Conversación no encontrada")

    messages = (
        db.query(InstagramMessage)
        .filter(InstagramMessage.conversation_id == conversation_id)
        .order_by(InstagramMessage.created_at.asc())
        .all()
    )

    if conversation.unread_count:
        conversation.unread_count = 0
        db.commit()

    return messages


@router.post("/instagram/conversations/{conversation_id}/messages", response_model=InstagramMessageResponse)
def send_instagram_message(
    conversation_id: int,
    data: SendMessageRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    if not INSTAGRAM_ACCESS_TOKEN or not INSTAGRAM_BUSINESS_ACCOUNT_ID:
        raise HTTPException(status_code=503, detail="Instagram no está configurado en el servidor (faltan variables de entorno)")

    conversation = db.query(InstagramConversation).filter(InstagramConversation.id == conversation_id).first()
    if not conversation:
        raise HTTPException(status_code=404, detail="Conversación no encontrada")

    body = data.body.strip()
    if not body:
        raise HTTPException(status_code=400, detail="El mensaje no puede estar vacío")

    url = f"{GRAPH_BASE_URL}/{INSTAGRAM_API_VERSION}/{INSTAGRAM_BUSINESS_ACCOUNT_ID}/messages"
    payload = {
        "recipient": {"id": conversation.igsid},
        "message": {"text": body},
    }
    headers = {"Authorization": f"Bearer {INSTAGRAM_ACCESS_TOKEN}"}

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
        raise HTTPException(status_code=502, detail="No se pudo conectar con Instagram") from error

    ig_message_id = response.json().get("message_id")

    message = InstagramMessage(
        conversation_id=conversation.id,
        direction="out",
        ig_message_id=ig_message_id,
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


@router.patch("/instagram/conversations/{conversation_id}/link-client", response_model=InstagramConversationResponse)
def link_conversation_to_client(
    conversation_id: int,
    data: LinkClientRequest,
    db: Session = Depends(get_db),
    _: User = Depends(get_current_user),
):
    conversation = db.query(InstagramConversation).filter(InstagramConversation.id == conversation_id).first()
    if not conversation:
        raise HTTPException(status_code=404, detail="Conversación no encontrada")

    if data.client_id is not None:
        client = db.query(Client).filter(Client.id == data.client_id).first()
        if not client:
            raise HTTPException(status_code=404, detail="Cliente no encontrado")

    conversation.client_id = data.client_id
    db.commit()
    return (
        db.query(InstagramConversation)
        .options(joinedload(InstagramConversation.client))
        .filter(InstagramConversation.id == conversation_id)
        .first()
    )
