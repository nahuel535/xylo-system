from decimal import Decimal
from typing import Optional
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session

from app.db.session import get_db
from app.models.quote import Quote
from app.schemas.quote import QuoteCreate, QuoteUpdate, QuoteResponse

router = APIRouter(prefix="/quotes", tags=["Presupuestos"])


def _calc_totals(items, discount_usd):
    subtotal = sum(Decimal(str(i.unit_price_usd)) * i.quantity for i in items)
    total = max(subtotal - Decimal(str(discount_usd)), Decimal("0"))
    return subtotal, total


@router.get("", response_model=list[QuoteResponse])
def list_quotes(
    db: Session = Depends(get_db),
    status: Optional[str] = Query(None),
):
    q = db.query(Quote)
    if status:
        q = q.filter(Quote.status == status)
    return q.order_by(Quote.id.desc()).all()


@router.post("", response_model=QuoteResponse)
def create_quote(data: QuoteCreate, db: Session = Depends(get_db)):
    subtotal, total = _calc_totals(data.items, data.discount_usd)
    quote = Quote(
        client_name=data.client_name,
        client_phone=data.client_phone,
        items=[i.model_dump() for i in data.items],
        subtotal_usd=subtotal,
        discount_usd=data.discount_usd,
        total_usd=total,
        status=data.status,
        valid_until=data.valid_until,
        notes=data.notes,
    )
    db.add(quote)
    db.commit()
    db.refresh(quote)
    return quote


@router.get("/{quote_id}", response_model=QuoteResponse)
def get_quote(quote_id: int, db: Session = Depends(get_db)):
    quote = db.query(Quote).filter(Quote.id == quote_id).first()
    if not quote:
        raise HTTPException(status_code=404, detail="Presupuesto no encontrado")
    return quote


@router.patch("/{quote_id}", response_model=QuoteResponse)
def update_quote(quote_id: int, data: QuoteUpdate, db: Session = Depends(get_db)):
    quote = db.query(Quote).filter(Quote.id == quote_id).first()
    if not quote:
        raise HTTPException(status_code=404, detail="Presupuesto no encontrado")

    if data.items is not None:
        discount = data.discount_usd if data.discount_usd is not None else Decimal(str(quote.discount_usd))
        subtotal, total = _calc_totals(data.items, discount)
        quote.items = [i.model_dump() for i in data.items]
        quote.subtotal_usd = subtotal
        quote.total_usd = total
    elif data.discount_usd is not None:
        from app.schemas.quote import QuoteItem
        items = [QuoteItem(**i) for i in quote.items]
        subtotal, total = _calc_totals(items, data.discount_usd)
        quote.subtotal_usd = subtotal
        quote.total_usd = total

    for field in ["client_name", "client_phone", "discount_usd", "status", "valid_until", "notes"]:
        val = getattr(data, field, None)
        if val is not None:
            setattr(quote, field, val)

    db.commit()
    db.refresh(quote)
    return quote


@router.delete("/{quote_id}")
def delete_quote(quote_id: int, db: Session = Depends(get_db)):
    quote = db.query(Quote).filter(Quote.id == quote_id).first()
    if not quote:
        raise HTTPException(status_code=404, detail="Presupuesto no encontrado")
    db.delete(quote)
    db.commit()
    return {"ok": True}
