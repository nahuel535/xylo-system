from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.db.session import get_db
from app.models.debtor import Debtor
from app.schemas.debtor import DebtorCreate, DebtorUpdate, DebtorResponse
from typing import List

router = APIRouter(prefix="/debtors", tags=["Debtors"])


@router.get("/", response_model=List[DebtorResponse])
def list_debtors(db: Session = Depends(get_db)):
    return db.query(Debtor).order_by(Debtor.paid, Debtor.due_date.asc().nullslast(), Debtor.created_at.desc()).all()


@router.post("/", response_model=DebtorResponse)
def create_debtor(data: DebtorCreate, db: Session = Depends(get_db)):
    debtor = Debtor(**data.model_dump())
    db.add(debtor)
    db.commit()
    db.refresh(debtor)
    return debtor


@router.put("/{debtor_id}", response_model=DebtorResponse)
def update_debtor(debtor_id: int, data: DebtorUpdate, db: Session = Depends(get_db)):
    debtor = db.query(Debtor).filter(Debtor.id == debtor_id).first()
    if not debtor:
        raise HTTPException(status_code=404, detail="Deudor no encontrado")
    for key, value in data.model_dump().items():
        setattr(debtor, key, value)
    db.commit()
    db.refresh(debtor)
    return debtor


@router.patch("/{debtor_id}/toggle-paid", response_model=DebtorResponse)
def toggle_paid(debtor_id: int, db: Session = Depends(get_db)):
    debtor = db.query(Debtor).filter(Debtor.id == debtor_id).first()
    if not debtor:
        raise HTTPException(status_code=404, detail="Deudor no encontrado")
    debtor.paid = not debtor.paid
    db.commit()
    db.refresh(debtor)
    return debtor


@router.delete("/{debtor_id}")
def delete_debtor(debtor_id: int, db: Session = Depends(get_db)):
    debtor = db.query(Debtor).filter(Debtor.id == debtor_id).first()
    if not debtor:
        raise HTTPException(status_code=404, detail="Deudor no encontrado")
    db.delete(debtor)
    db.commit()
    return {"ok": True}
