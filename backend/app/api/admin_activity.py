from datetime import date
from typing import Optional

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session

from app.core.dependencies import require_admin
from app.db.session import get_db
from app.models.appointment import Appointment
from app.models.audit_log import AuditLog
from app.models.client import Client, ClientInteraction, ClientReminder
from app.models.quote import Quote
from app.models.trash_item import TrashItem
from app.models.user import User
from app.services.audit import record_audit


router = APIRouter(prefix="/admin", tags=["Admin Activity"])


@router.get("/activity")
def list_activity(
    entity_type: Optional[str] = Query(None),
    limit: int = Query(100, ge=1, le=250),
    db: Session = Depends(get_db),
    _: User = Depends(require_admin),
):
    query = db.query(AuditLog, User).outerjoin(User, AuditLog.user_id == User.id)
    if entity_type:
        query = query.filter(AuditLog.entity_type == entity_type)
    rows = query.order_by(AuditLog.created_at.desc()).limit(limit).all()
    return [
        {
            "id": log.id,
            "entity_type": log.entity_type,
            "entity_id": log.entity_id,
            "action": log.action,
            "changes": log.changes,
            "created_at": log.created_at,
            "user_id": log.user_id,
            "user_name": user.name if user else "Sistema",
        }
        for log, user in rows
    ]


@router.get("/trash")
def list_trash(
    db: Session = Depends(get_db),
    _: User = Depends(require_admin),
):
    rows = (
        db.query(TrashItem, User)
        .outerjoin(User, TrashItem.deleted_by == User.id)
        .order_by(TrashItem.deleted_at.desc())
        .all()
    )
    return [
        {
            "id": item.id,
            "entity_type": item.entity_type,
            "entity_id": item.entity_id,
            "label": item.label,
            "deleted_at": item.deleted_at,
            "deleted_by": item.deleted_by,
            "deleted_by_name": user.name if user else "Sistema",
        }
        for item, user in rows
    ]


@router.post("/trash/{trash_id}/restore")
def restore_trash_item(
    trash_id: int,
    db: Session = Depends(get_db),
    current_admin: User = Depends(require_admin),
):
    item = db.query(TrashItem).filter(TrashItem.id == trash_id).first()
    if not item:
        raise HTTPException(status_code=404, detail="Elemento de papelera no encontrado")

    model_by_type = {"client": Client, "appointment": Appointment, "quote": Quote}
    model = model_by_type.get(item.entity_type)
    if model is None:
        raise HTTPException(status_code=400, detail="Este tipo de elemento no se puede restaurar")
    if db.query(model).filter(model.id == item.entity_id).first():
        raise HTTPException(status_code=409, detail="Ya existe un registro con el mismo identificador")

    if item.entity_type == "client":
        _restore_client(db, item)
    elif item.entity_type == "appointment":
        _restore_appointment(db, item)
    else:
        _restore_quote(db, item)

    record_audit(
        db,
        entity_type=item.entity_type,
        entity_id=item.entity_id,
        user=current_admin,
        action="restored",
    )
    db.delete(item)
    db.commit()
    return {"message": f"{item.label} restaurado correctamente"}


def _restore_client(db: Session, item: TrashItem) -> None:
    payload = item.payload
    data = payload["record"]
    client = Client(
        id=item.entity_id,
        owner_user_id=data.get("owner_user_id"),
        name=data["name"],
        phone=data.get("phone"),
        email=data.get("email"),
        instagram=data.get("instagram"),
        source=data.get("source"),
        status=data.get("status", "lead"),
        tags=data.get("tags"),
        notes=data.get("notes"),
        needs_followup=data.get("needs_followup", False),
        followup_date=_date(data.get("followup_date")),
        last_contact_date=_date(data.get("last_contact_date")),
    )
    db.add(client)
    db.flush()
    for interaction in payload.get("interactions", []):
        db.add(ClientInteraction(
            client_id=client.id,
            type=interaction["type"],
            content=interaction.get("content"),
            date=_date(interaction["date"]),
        ))
    for reminder in payload.get("reminders", []):
        db.add(ClientReminder(
            client_id=client.id,
            type=reminder["type"],
            due_date=_date(reminder["due_date"]),
            status=reminder.get("status", "pending"),
            note=reminder.get("note"),
        ))
    appointment_ids = payload.get("appointment_ids", [])
    quote_ids = payload.get("quote_ids", [])
    if appointment_ids:
        db.query(Appointment).filter(Appointment.id.in_(appointment_ids)).update(
            {Appointment.client_id: client.id},
            synchronize_session=False,
        )
    if quote_ids:
        db.query(Quote).filter(Quote.id.in_(quote_ids)).update(
            {Quote.client_id: client.id},
            synchronize_session=False,
        )


def _restore_appointment(db: Session, item: TrashItem) -> None:
    data = item.payload["record"]
    db.add(Appointment(
        id=item.entity_id,
        title=data["title"],
        client_id=data.get("client_id"),
        contact_name=data.get("contact_name"),
        contact_phone=data.get("contact_phone"),
        contact_instagram=data.get("contact_instagram"),
        description=data.get("description"),
        date=_date(data["date"]),
        start_time=data["start_time"],
        end_time=data.get("end_time"),
        status=data.get("status", "pending"),
        notes=data.get("notes"),
        created_by=data.get("created_by"),
    ))


def _restore_quote(db: Session, item: TrashItem) -> None:
    data = item.payload["record"]
    db.add(Quote(
        id=item.entity_id,
        client_id=data.get("client_id"),
        client_name=data["client_name"],
        client_phone=data.get("client_phone"),
        items=data.get("items", []),
        subtotal_usd=data.get("subtotal_usd", 0),
        discount_usd=data.get("discount_usd", 0),
        total_usd=data.get("total_usd", 0),
        status=data.get("status", "draft"),
        valid_until=_date(data.get("valid_until")),
        notes=data.get("notes"),
        created_by=data.get("created_by"),
    ))


def _date(value):
    if not value or isinstance(value, date):
        return value
    return date.fromisoformat(value)
