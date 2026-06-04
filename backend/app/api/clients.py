from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from sqlalchemy import or_
from typing import Optional

from app.db.session import get_db
from app.models.client import Client, ClientInteraction
from app.schemas.client import (
    ClientCreate, ClientUpdate, ClientResponse,
    ClientInteractionCreate, ClientInteractionResponse,
)

router = APIRouter(prefix="/clients", tags=["CRM"])


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


@router.post("/{client_id}/interactions", response_model=ClientInteractionResponse)
def add_interaction(client_id: int, data: ClientInteractionCreate, db: Session = Depends(get_db)):
    client = db.query(Client).filter(Client.id == client_id).first()
    if not client:
        raise HTTPException(status_code=404, detail="Cliente no encontrado")
    interaction = ClientInteraction(client_id=client_id, **data.model_dump())
    db.add(interaction)
    if not client.last_contact_date or data.date >= client.last_contact_date:
        client.last_contact_date = data.date
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
