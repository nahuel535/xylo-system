from typing import Any, Optional

from fastapi.encoders import jsonable_encoder
from sqlalchemy.orm import Session

from app.models.audit_log import AuditLog
from app.models.trash_item import TrashItem
from app.models.user import User


def record_audit(
    db: Session,
    *,
    entity_type: str,
    entity_id: int,
    user: User,
    action: str,
    changes: Optional[dict[str, Any]] = None,
) -> None:
    db.add(AuditLog(
        entity_type=entity_type,
        entity_id=entity_id,
        user_id=user.id,
        action=action,
        changes=jsonable_encoder(changes) if changes else None,
    ))


def move_to_trash(
    db: Session,
    *,
    entity_type: str,
    entity_id: int,
    label: str,
    payload: dict[str, Any],
    user: User,
) -> TrashItem:
    item = TrashItem(
        entity_type=entity_type,
        entity_id=entity_id,
        label=label,
        payload=jsonable_encoder(payload),
        deleted_by=user.id,
    )
    db.add(item)
    record_audit(
        db,
        entity_type=entity_type,
        entity_id=entity_id,
        user=user,
        action="deleted",
    )
    return item
