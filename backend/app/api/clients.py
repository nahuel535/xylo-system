from datetime import date as date_type, timedelta, date
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from sqlalchemy import or_, func
from typing import Optional

from app.db.session import get_db
from app.models.client import Client, ClientInteraction, ClientReminder
from app.models.user import User
from app.core.dependencies import ensure_owner_or_admin, get_current_user
from app.services.audit import move_to_trash, record_audit
from app.schemas.client import (
    ClientCreate, ClientUpdate, ClientResponse,
    ClientInteractionCreate, ClientInteractionResponse,
    ReminderCreate, ReminderUpdate, ReminderResponse, ReminderWithClientResponse,
)

router = APIRouter(prefix="/clients", tags=["CRM"])

# Plantillas de recordatorios automáticos al registrar una venta
REMINDER_TEMPLATES = {
    "followup_1week": {
        "days": 7,
        "note": "Llamar o escribir para saber cómo se siente con el nuevo celular y si todo funciona correctamente.",
    },
    "promo_3months": {
        "days": 90,
        "note": "Ofrecer promo de referidos: si trae un amigo, obtiene un descuento o beneficio especial.",
    },
}


# ── Recordatorios globales ──────────────────────────────────────────────────

@router.get("/reminders/count")
def get_reminder_count(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    today = date.today()
    query = db.query(ClientReminder).join(Client, ClientReminder.client_id == Client.id)
    if current_user.role != "admin":
        query = query.filter(Client.owner_user_id == current_user.id)
    count = query.filter(
        ClientReminder.status == "pending",
        ClientReminder.due_date <= today,
    ).count()
    return {"count": count}


@router.get("/reminders", response_model=list[ReminderWithClientResponse])
def list_reminders(
    db: Session = Depends(get_db),
    status: Optional[str] = Query("pending"),
    current_user: User = Depends(get_current_user),
):
    query = db.query(ClientReminder, Client).join(Client, ClientReminder.client_id == Client.id)
    if current_user.role != "admin":
        query = query.filter(Client.owner_user_id == current_user.id)
    rows = query.filter(ClientReminder.status == status).order_by(ClientReminder.due_date.asc()).all()
    return [
        ReminderWithClientResponse(
            id=r.id,
            client_id=r.client_id,
            type=r.type,
            due_date=r.due_date,
            status=r.status,
            note=r.note,
            created_at=r.created_at,
            client_name=c.name,
            client_phone=c.phone,
            client_instagram=c.instagram,
            client_status=c.status,
        )
        for r, c in rows
    ]


@router.put("/reminders/{reminder_id}", response_model=ReminderResponse)
def update_reminder(
    reminder_id: int,
    data: ReminderUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    reminder = db.query(ClientReminder).filter(ClientReminder.id == reminder_id).first()
    if not reminder:
        raise HTTPException(status_code=404, detail="Recordatorio no encontrado")
    client = db.query(Client).filter(Client.id == reminder.client_id).first()
    ensure_owner_or_admin(current_user, client.owner_user_id if client else None)
    reminder.status = data.status
    db.commit()
    db.refresh(reminder)
    return reminder


# ── Clientes ────────────────────────────────────────────────────────────────

@router.get("/", response_model=list[ClientResponse])
def list_clients(
    db: Session = Depends(get_db),
    search: Optional[str] = Query(None),
    status: Optional[str] = Query(None),
    needs_followup: Optional[bool] = Query(None),
    current_user: User = Depends(get_current_user),
):
    q = db.query(Client)
    if current_user.role != "admin":
        q = q.filter(Client.owner_user_id == current_user.id)
    if search:
        like = f"%{search}%"
        q = q.filter(or_(
            Client.name.ilike(like),
            Client.phone.ilike(like),
            Client.email.ilike(like),
            Client.instagram.ilike(like),
        ))
    if status:
        q = q.filter(Client.status == status)
    if needs_followup is not None:
        q = q.filter(Client.needs_followup == needs_followup)
    return q.order_by(Client.created_at.desc()).all()


@router.post("/", response_model=ClientResponse)
def create_client(
    data: ClientCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    client = Client(owner_user_id=current_user.id, **data.model_dump())
    db.add(client)
    db.flush()
    record_audit(db, entity_type="client", entity_id=client.id, user=current_user, action="created")
    db.commit()
    db.refresh(client)
    return client


@router.get("/{client_id}", response_model=ClientResponse)
def get_client(
    client_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    client = db.query(Client).filter(Client.id == client_id).first()
    if not client:
        raise HTTPException(status_code=404, detail="Cliente no encontrado")
    ensure_owner_or_admin(current_user, client.owner_user_id)
    return client


@router.put("/{client_id}", response_model=ClientResponse)
def update_client(
    client_id: int,
    data: ClientUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    client = db.query(Client).filter(Client.id == client_id).first()
    if not client:
        raise HTTPException(status_code=404, detail="Cliente no encontrado")
    ensure_owner_or_admin(current_user, client.owner_user_id)
    changes = {}
    for field, value in data.model_dump(exclude_unset=True).items():
        old_value = getattr(client, field)
        if old_value != value:
            changes[field] = {"old": old_value, "new": value}
        setattr(client, field, value)
    if changes:
        record_audit(
            db,
            entity_type="client",
            entity_id=client.id,
            user=current_user,
            action="updated",
            changes=changes,
        )
    db.commit()
    db.refresh(client)
    return client


@router.delete("/{client_id}")
def delete_client(
    client_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    client = db.query(Client).filter(Client.id == client_id).first()
    if not client:
        raise HTTPException(status_code=404, detail="Cliente no encontrado")
    ensure_owner_or_admin(current_user, client.owner_user_id)
    from app.models.appointment import Appointment
    from app.models.quote import Quote

    move_to_trash(
        db,
        entity_type="client",
        entity_id=client.id,
        label=client.name,
        user=current_user,
        payload={
            "record": {
                "owner_user_id": client.owner_user_id,
                "name": client.name,
                "phone": client.phone,
                "email": client.email,
                "instagram": client.instagram,
                "source": client.source,
                "status": client.status,
                "tags": client.tags,
                "notes": client.notes,
                "needs_followup": client.needs_followup,
                "followup_date": client.followup_date,
                "last_contact_date": client.last_contact_date,
            },
            "interactions": [
                {"type": row.type, "content": row.content, "date": row.date}
                for row in client.interactions
            ],
            "reminders": [
                {
                    "type": row.type,
                    "due_date": row.due_date,
                    "status": row.status,
                    "note": row.note,
                }
                for row in client.reminders
            ],
            "appointment_ids": [
                row[0]
                for row in db.query(Appointment.id).filter(Appointment.client_id == client.id).all()
            ],
            "quote_ids": [
                row[0]
                for row in db.query(Quote.id).filter(Quote.client_id == client.id).all()
            ],
        },
    )
    db.delete(client)
    db.commit()
    return {"message": "Cliente eliminado"}


# ── Interacciones ───────────────────────────────────────────────────────────

@router.post("/{client_id}/interactions", response_model=ClientInteractionResponse)
def add_interaction(
    client_id: int,
    data: ClientInteractionCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    client = db.query(Client).filter(Client.id == client_id).first()
    if not client:
        raise HTTPException(status_code=404, detail="Cliente no encontrado")
    ensure_owner_or_admin(current_user, client.owner_user_id)

    interaction = ClientInteraction(client_id=client_id, **data.model_dump())
    db.add(interaction)

    if not client.last_contact_date or data.date >= client.last_contact_date:
        client.last_contact_date = data.date

    # Si es una venta, actualizar estado y generar recordatorios automáticos
    if data.type == "venta":
        client.status = "client"
        for reminder_type, tpl in REMINDER_TEMPLATES.items():
            # No duplicar si ya existe uno pendiente del mismo tipo
            existing = db.query(ClientReminder).filter(
                ClientReminder.client_id == client_id,
                ClientReminder.type == reminder_type,
                ClientReminder.status == "pending",
            ).first()
            if not existing:
                due = data.date + timedelta(days=tpl["days"])
                db.add(ClientReminder(
                    client_id=client_id,
                    type=reminder_type,
                    due_date=due,
                    note=tpl["note"],
                ))

    db.commit()
    db.refresh(interaction)
    return interaction


@router.delete("/{client_id}/interactions/{interaction_id}")
def delete_interaction(
    client_id: int,
    interaction_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    client = db.query(Client).filter(Client.id == client_id).first()
    if not client:
        raise HTTPException(status_code=404, detail="Cliente no encontrado")
    ensure_owner_or_admin(current_user, client.owner_user_id)
    interaction = db.query(ClientInteraction).filter(
        ClientInteraction.id == interaction_id,
        ClientInteraction.client_id == client_id,
    ).first()
    if not interaction:
        raise HTTPException(status_code=404, detail="Interacción no encontrada")
    db.delete(interaction)
    if client:
        remaining = (
            db.query(ClientInteraction)
            .filter(ClientInteraction.client_id == client_id, ClientInteraction.id != interaction_id)
            .order_by(ClientInteraction.date.desc())
            .first()
        )
        client.last_contact_date = remaining.date if remaining else None
    db.commit()
    return {"message": "Interacción eliminada"}


# ── Ventas por cliente (match por nombre) ───────────────────────────────────

@router.get("/{client_id}/sales")
def get_client_sales(
    client_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    from app.models.sale import Sale
    from app.models.product import Product

    client = db.query(Client).filter(Client.id == client_id).first()
    if not client:
        raise HTTPException(status_code=404, detail="Cliente no encontrado")
    ensure_owner_or_admin(current_user, client.owner_user_id)

    rows = (
        db.query(Sale, Product)
        .join(Product, Sale.product_id == Product.id)
        .filter(func.lower(Sale.client_name) == client.name.lower())
        .order_by(Sale.sale_date.desc())
        .limit(20)
        .all()
    )

    if current_user.role != "admin":
        rows = [(sale, product) for sale, product in rows if sale.seller_id == current_user.id]

    total_usd = sum(float(s.sale_price_usd) for s, _ in rows)

    return {
        "total_sales": len(rows),
        "total_usd": round(total_usd, 2),
        "sales": [
            {
                "id": s.id,
                "model": p.model,
                "storage": p.storage,
                "color": p.color,
                "sale_price_usd": float(s.sale_price_usd),
                "sale_date": s.sale_date,
            }
            for s, p in rows
        ],
    }


# ── Recordatorios por cliente ───────────────────────────────────────────────

@router.post("/{client_id}/reminders", response_model=ReminderResponse)
def create_reminder(
    client_id: int,
    data: ReminderCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    client = db.query(Client).filter(Client.id == client_id).first()
    if not client:
        raise HTTPException(status_code=404, detail="Cliente no encontrado")
    ensure_owner_or_admin(current_user, client.owner_user_id)
    reminder = ClientReminder(client_id=client_id, **data.model_dump())
    db.add(reminder)
    db.commit()
    db.refresh(reminder)
    return reminder
