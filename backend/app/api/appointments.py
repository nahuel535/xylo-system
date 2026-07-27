from datetime import date as date_type
from typing import Optional
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session, joinedload

from app.db.session import get_db
from app.models.appointment import Appointment
from app.models.client import Client
from app.schemas.appointment import AppointmentCreate, AppointmentUpdate, AppointmentResponse
from app.models.user import User
from app.core.dependencies import ensure_owner_or_admin, get_current_user

router = APIRouter(prefix="/appointments", tags=["Agenda"])


def _validate_client_access(db: Session, current_user: User, client_id: Optional[int]) -> None:
    if not client_id:
        return
    q = db.query(Client).filter(Client.id == client_id)
    if current_user.role != "admin":
        q = q.filter(Client.owner_user_id == current_user.id)
    if not q.first():
        raise HTTPException(status_code=404, detail="Cliente no encontrado")


@router.get("", response_model=list[AppointmentResponse])
def list_appointments(
    db: Session = Depends(get_db),
    date: Optional[date_type] = Query(None),
    month: Optional[int] = Query(None),
    year: Optional[int] = Query(None),
    status: Optional[str] = Query(None),
    client_id: Optional[int] = Query(None),
    current_user: User = Depends(get_current_user),
):
    q = db.query(Appointment).options(joinedload(Appointment.client))
    if current_user.role != "admin":
        q = q.filter(Appointment.created_by == current_user.id)

    if date:
        q = q.filter(Appointment.date == date)
    elif month and year:
        from sqlalchemy import extract
        q = q.filter(
            extract("month", Appointment.date) == month,
            extract("year", Appointment.date) == year,
        )

    if status:
        q = q.filter(Appointment.status == status)
    if client_id:
        _validate_client_access(db, current_user, client_id)
        q = q.filter(Appointment.client_id == client_id)

    return q.order_by(Appointment.date.asc(), Appointment.start_time.asc()).all()


@router.post("", response_model=AppointmentResponse)
def create_appointment(
    data: AppointmentCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    _validate_client_access(db, current_user, data.client_id)
    appt = Appointment(created_by=current_user.id, **data.model_dump())
    db.add(appt)
    db.commit()
    db.refresh(appt)
    return db.query(Appointment).options(joinedload(Appointment.client)).filter(Appointment.id == appt.id).first()


@router.get("/{appt_id}", response_model=AppointmentResponse)
def get_appointment(
    appt_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    appt = db.query(Appointment).options(joinedload(Appointment.client)).filter(Appointment.id == appt_id).first()
    if not appt:
        raise HTTPException(status_code=404, detail="Turno no encontrado")
    ensure_owner_or_admin(current_user, appt.created_by)
    return appt


@router.patch("/{appt_id}", response_model=AppointmentResponse)
def update_appointment(
    appt_id: int,
    data: AppointmentUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    appt = db.query(Appointment).filter(Appointment.id == appt_id).first()
    if not appt:
        raise HTTPException(status_code=404, detail="Turno no encontrado")
    ensure_owner_or_admin(current_user, appt.created_by)
    update_data = data.model_dump(exclude_unset=True)
    if "client_id" in update_data:
        _validate_client_access(db, current_user, update_data["client_id"])
    for field, value in update_data.items():
        setattr(appt, field, value)
    db.commit()
    db.refresh(appt)
    return db.query(Appointment).options(joinedload(Appointment.client)).filter(Appointment.id == appt_id).first()


@router.delete("/{appt_id}")
def delete_appointment(
    appt_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    appt = db.query(Appointment).filter(Appointment.id == appt_id).first()
    if not appt:
        raise HTTPException(status_code=404, detail="Turno no encontrado")
    ensure_owner_or_admin(current_user, appt.created_by)
    db.delete(appt)
    db.commit()
    return {"ok": True}
