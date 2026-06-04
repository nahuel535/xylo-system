from datetime import date as date_type, timedelta
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from sqlalchemy import or_
from typing import Optional

from app.db.session import get_db
from app.models.client import Client, ClientInteraction, ClientReminder
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

@router.get("/reminders", response_model=list[ReminderWithClientResponse])
def list_reminders(
    db: Session = Depends(get_db),
    status: Optional[str] = Query("pending"),
):
    rows = (
        db.query(ClientReminder, Client)
        .join(Client, ClientReminder.client_id == Client.id)
        .filter(ClientReminder.status == status)
        .order_by(ClientReminder.due_date.asc())
        .all()
    )
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
def update_reminder(reminder_id: int, data: ReminderUpdate, db: Session = Depends(get_db)):
    reminder = db.query(ClientReminder).filter(ClientReminder.id == reminder_id).first()
    if not reminder:
        raise HTTPException(status_code=404, detail="Recordatorio no encontrado")
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
):
    q = db.query(Client)
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
def create_client(data: ClientCreate, db: Session = Depends(get_db)):
    client = Client(**data.model_dump())
    db.add(client)
    db.commit()
    db.refresh(client)
    return client


@router.get("/{client_id}", response_model=ClientResponse)
def get_client(client_id: int, db: Session = Depends(get_db)):
    client = db.query(Client).filter(Client.id == client_id).first()
    if not client:
        raise HTTPException(status_code=404, detail="Cliente no encontrado")
    return client


@router.put("/{client_id}", response_model=ClientResponse)
def update_client(client_id: int, data: ClientUpdate, db: Session = Depends(get_db)):
    client = db.query(Client).filter(Client.id == client_id).first()
    if not client:
        raise HTTPException(status_code=404, detail="Cliente no encontrado")
    for field, value in data.model_dump(exclude_unset=True).items():
        setattr(client, field, value)
    db.commit()
    db.refresh(client)
    return client


@router.delete("/{client_id}")
def delete_client(client_id: int, db: Session = Depends(get_db)):
    client = db.query(Client).filter(Client.id == client_id).first()
    if not client:
        raise HTTPException(status_code=404, detail="Cliente no encontrado")
    db.delete(client)
    db.commit()
    return {"message": "Cliente eliminado"}


# ── Interacciones ───────────────────────────────────────────────────────────

@router.post("/{client_id}/interactions", response_model=ClientInteractionResponse)
def add_interaction(client_id: int, data: ClientInteractionCreate, db: Session = Depends(get_db)):
    client = db.query(Client).filter(Client.id == client_id).first()
    if not client:
        raise HTTPException(status_code=404, detail="Cliente no encontrado")

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
def delete_interaction(client_id: int, interaction_id: int, db: Session = Depends(get_db)):
    interaction = db.query(ClientInteraction).filter(
        ClientInteraction.id == interaction_id,
        ClientInteraction.client_id == client_id,
    ).first()
    if not interaction:
        raise HTTPException(status_code=404, detail="Interacción no encontrada")
    db.delete(interaction)
    client = db.query(Client).filter(Client.id == client_id).first()
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


# ── Recordatorios por cliente ───────────────────────────────────────────────

@router.post("/{client_id}/reminders", response_model=ReminderResponse)
def create_reminder(client_id: int, data: ReminderCreate, db: Session = Depends(get_db)):
    client = db.query(Client).filter(Client.id == client_id).first()
    if not client:
        raise HTTPException(status_code=404, detail="Cliente no encontrado")
    reminder = ClientReminder(client_id=client_id, **data.model_dump())
    db.add(reminder)
    db.commit()
    db.refresh(reminder)
    return reminder
