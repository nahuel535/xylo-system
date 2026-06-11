from datetime import date as date_type
from typing import Optional
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session, joinedload

from app.db.session import get_db
from app.models.appointment import Appointment
from app.schemas.appointment import AppointmentCreate, AppointmentUpdate, AppointmentResponse

router = APIRouter(prefix="/appointments", tags=["Agenda"])


@router.get("", response_model=list[AppointmentResponse])
def list_appointments(
    db: Session = Depends(get_db),
    date: Optional[date_type] = Query(None),
    month: Optional[int] = Query(None),
    year: Optional[int] = Query(None),
    status: Optional[str] = Query(None),
):
    q = db.query(Appointment).options(joinedload(Appointment.client))

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

    return q.order_by(Appointment.date.asc(), Appointment.start_time.asc()).all()


@router.post("", response_model=AppointmentResponse)
def create_appointment(data: AppointmentCreate, db: Session = Depends(get_db)):
    appt = Appointment(**data.model_dump())
    db.add(appt)
    db.commit()
    db.refresh(appt)
    return db.query(Appointment).options(joinedload(Appointment.client)).filter(Appointment.id == appt.id).first()


@router.get("/{appt_id}", response_model=AppointmentResponse)
def get_appointment(appt_id: int, db: Session = Depends(get_db)):
    appt = db.query(Appointment).options(joinedload(Appointment.client)).filter(Appointment.id == appt_id).first()
    if not appt:
        raise HTTPException(status_code=404, detail="Turno no encontrado")
    return appt


@router.patch("/{appt_id}", response_model=AppointmentResponse)
def update_appointment(appt_id: int, data: AppointmentUpdate, db: Session = Depends(get_db)):
    appt = db.query(Appointment).filter(Appointment.id == appt_id).first()
    if not appt:
        raise HTTPException(status_code=404, detail="Turno no encontrado")
    for field, value in data.model_dump(exclude_unset=True).items():
        setattr(appt, field, value)
    db.commit()
    db.refresh(appt)
    return db.query(Appointment).options(joinedload(Appointment.client)).filter(Appointment.id == appt_id).first()


@router.delete("/{appt_id}")
def delete_appointment(appt_id: int, db: Session = Depends(get_db)):
    appt = db.query(Appointment).filter(Appointment.id == appt_id).first()
    if not appt:
        raise HTTPException(status_code=404, detail="Turno no encontrado")
    db.delete(appt)
    db.commit()
    return {"ok": True}
