from datetime import date, datetime, timedelta, timezone

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session

from app.core.dependencies import get_current_user, require_admin_or_technician
from app.db.session import get_db
from app.models.audit_log import AuditLog
from app.models.part_price import PartPrice
from app.models.service_ticket import ServiceTicket
from app.models.user import User
from app.schemas.service import (
    PartPriceCreate,
    PartPriceUpdate,
    ServiceTicketCreate,
    ServiceTicketUpdate,
)

tickets_router = APIRouter(prefix="/service-tickets", tags=["Servicio Técnico"])
part_prices_router = APIRouter(prefix="/part-prices", tags=["Servicio Técnico"])


STATUS_TIMESTAMP_FIELD = {
    "diagnostico": "diagnosed_at",
    "reparacion": None,
    "listo": "repaired_at",
    "entregado": "delivered_at",
}


@tickets_router.get("")
def list_service_tickets(
    status: str | None = Query(None),
    assigned_technician_id: int | None = Query(None),
    db: Session = Depends(get_db),
    current_user: User = Depends(require_admin_or_technician),
):
    query = db.query(ServiceTicket)
    if status:
        query = query.filter(ServiceTicket.status == status)
    if assigned_technician_id:
        query = query.filter(ServiceTicket.assigned_technician_id == assigned_technician_id)
    tickets = query.order_by(ServiceTicket.received_at.desc()).all()
    return [_ticket_payload(db, ticket) for ticket in tickets]


@tickets_router.get("/{ticket_id}")
def get_service_ticket(
    ticket_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_admin_or_technician),
):
    ticket = db.query(ServiceTicket).filter(ServiceTicket.id == ticket_id).first()
    if not ticket:
        raise HTTPException(status_code=404, detail="Ticket no encontrado")
    return _ticket_payload(db, ticket)


@tickets_router.post("")
def create_service_ticket(
    data: ServiceTicketCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_admin_or_technician),
):
    ticket = ServiceTicket(
        client_name=data.client_name.strip(),
        client_phone=data.client_phone,
        client_id=data.client_id,
        device_brand=data.device_brand,
        device_model=data.device_model,
        device_imei=data.device_imei,
        product_id=data.product_id,
        issue_description=data.issue_description.strip(),
        assigned_technician_id=data.assigned_technician_id,
        estimated_cost_usd=data.estimated_cost_usd,
        notes=data.notes,
        created_by=current_user.id,
        status="recibido",
    )
    db.add(ticket)
    db.flush()
    db.add(AuditLog(
        entity_type="service_ticket",
        entity_id=ticket.id,
        user_id=current_user.id,
        action="created",
    ))
    db.commit()
    db.refresh(ticket)
    return _ticket_payload(db, ticket)


@tickets_router.patch("/{ticket_id}")
def update_service_ticket(
    ticket_id: int,
    data: ServiceTicketUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_admin_or_technician),
):
    ticket = db.query(ServiceTicket).filter(ServiceTicket.id == ticket_id).first()
    if not ticket:
        raise HTTPException(status_code=404, detail="Ticket no encontrado")

    changes = {}
    payload = data.model_dump(exclude_unset=True)

    previous_status = ticket.status
    for field, value in payload.items():
        old_value = getattr(ticket, field)
        if old_value != value:
            changes[field] = {"old": str(old_value) if old_value is not None else None, "new": str(value)}
        setattr(ticket, field, value)

    if "status" in payload and payload["status"] != previous_status:
        new_status = payload["status"]
        now = datetime.now(timezone.utc)
        ts_field = STATUS_TIMESTAMP_FIELD.get(new_status)
        if ts_field and getattr(ticket, ts_field) is None:
            setattr(ticket, ts_field, now)
        if new_status == "entregado":
            if ticket.delivered_at is None:
                ticket.delivered_at = now
            if ticket.warranty_days:
                ticket.warranty_expires_at = now.date() + timedelta(days=ticket.warranty_days)

    if changes:
        db.add(AuditLog(
            entity_type="service_ticket",
            entity_id=ticket.id,
            user_id=current_user.id,
            action="updated",
            changes=changes,
        ))
    db.commit()
    db.refresh(ticket)
    return _ticket_payload(db, ticket)


@part_prices_router.get("")
def list_part_prices(
    category: str | None = Query(None),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    query = db.query(PartPrice)
    if category:
        query = query.filter(PartPrice.category == category)
    prices = query.order_by(PartPrice.category.asc(), PartPrice.label.asc()).all()
    return [_part_price_payload(price) for price in prices]


@part_prices_router.post("")
def create_part_price(
    data: PartPriceCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_admin_or_technician),
):
    price = PartPrice(
        category=data.category.strip(),
        label=data.label.strip(),
        price_usd=data.price_usd,
        notes=data.notes,
        updated_by=current_user.id,
    )
    db.add(price)
    db.commit()
    db.refresh(price)
    return _part_price_payload(price)


@part_prices_router.patch("/{price_id}")
def update_part_price(
    price_id: int,
    data: PartPriceUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_admin_or_technician),
):
    price = db.query(PartPrice).filter(PartPrice.id == price_id).first()
    if not price:
        raise HTTPException(status_code=404, detail="Precio no encontrado")
    for field, value in data.model_dump(exclude_unset=True).items():
        setattr(price, field, value)
    price.updated_by = current_user.id
    db.commit()
    db.refresh(price)
    return _part_price_payload(price)


@part_prices_router.delete("/{price_id}")
def delete_part_price(
    price_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_admin_or_technician),
):
    price = db.query(PartPrice).filter(PartPrice.id == price_id).first()
    if not price:
        raise HTTPException(status_code=404, detail="Precio no encontrado")
    db.delete(price)
    db.commit()
    return {"ok": True}


def _ticket_payload(db: Session, ticket: ServiceTicket) -> dict:
    technician = (
        db.query(User).filter(User.id == ticket.assigned_technician_id).first()
        if ticket.assigned_technician_id
        else None
    )
    return {
        "id": ticket.id,
        "client_name": ticket.client_name,
        "client_phone": ticket.client_phone,
        "client_id": ticket.client_id,
        "device_brand": ticket.device_brand,
        "device_model": ticket.device_model,
        "device_imei": ticket.device_imei,
        "product_id": ticket.product_id,
        "issue_description": ticket.issue_description,
        "diagnosis": ticket.diagnosis,
        "status": ticket.status,
        "assigned_technician_id": ticket.assigned_technician_id,
        "assigned_technician_name": technician.name if technician else None,
        "estimated_cost_usd": ticket.estimated_cost_usd,
        "final_cost_usd": ticket.final_cost_usd,
        "parts_used": ticket.parts_used,
        "warranty_days": ticket.warranty_days,
        "warranty_expires_at": ticket.warranty_expires_at,
        "notes": ticket.notes,
        "received_at": ticket.received_at,
        "diagnosed_at": ticket.diagnosed_at,
        "repaired_at": ticket.repaired_at,
        "delivered_at": ticket.delivered_at,
        "updated_at": ticket.updated_at,
    }


def _part_price_payload(price: PartPrice) -> dict:
    return {
        "id": price.id,
        "category": price.category,
        "label": price.label,
        "price_usd": price.price_usd,
        "notes": price.notes,
        "updated_at": price.updated_at,
    }
