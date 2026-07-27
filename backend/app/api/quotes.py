from decimal import Decimal
from typing import Optional
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session

from app.db.session import get_db
from app.models.quote import Quote
from app.models.client import Client
from app.models.user import User
from app.schemas.quote import QuoteCreate, QuoteUpdate, QuoteResponse
from app.core.dependencies import ensure_owner_or_admin, get_current_user
from app.services.audit import move_to_trash, record_audit

router = APIRouter(prefix="/quotes", tags=["Presupuestos"])


def _calc_totals(items, discount_usd):
    subtotal = sum(Decimal(str(i.unit_price_usd)) * i.quantity for i in items)
    total = max(subtotal - Decimal(str(discount_usd)), Decimal("0"))
    return subtotal, total


def _get_accessible_client(
    client_id: Optional[int],
    db: Session,
    current_user: User,
) -> Optional[Client]:
    if not client_id:
        return None
    query = db.query(Client).filter(Client.id == client_id)
    if current_user.role != "admin":
        query = query.filter(Client.owner_user_id == current_user.id)
    client = query.first()
    if not client:
        raise HTTPException(status_code=404, detail="Cliente no encontrado")
    return client


@router.get("", response_model=list[QuoteResponse])
def list_quotes(
    db: Session = Depends(get_db),
    status: Optional[str] = Query(None),
    client_id: Optional[int] = Query(None),
    current_user: User = Depends(get_current_user),
):
    q = db.query(Quote)
    if current_user.role != "admin":
        q = q.filter(Quote.created_by == current_user.id)
    if status:
        q = q.filter(Quote.status == status)
    if client_id:
        _get_accessible_client(client_id, db, current_user)
        q = q.filter(Quote.client_id == client_id)
    return q.order_by(Quote.id.desc()).all()


@router.post("", response_model=QuoteResponse)
def create_quote(
    data: QuoteCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    subtotal, total = _calc_totals(data.items, data.discount_usd)
    client = _get_accessible_client(data.client_id, db, current_user)
    quote = Quote(
        client_id=client.id if client else None,
        client_name=client.name if client else data.client_name,
        client_phone=client.phone if client else data.client_phone,
        items=[i.model_dump(mode="json") for i in data.items],
        subtotal_usd=subtotal,
        discount_usd=data.discount_usd,
        total_usd=total,
        status=data.status,
        valid_until=data.valid_until,
        notes=data.notes,
        created_by=current_user.id,
    )
    db.add(quote)
    db.flush()
    record_audit(db, entity_type="quote", entity_id=quote.id, user=current_user, action="created")
    db.commit()
    db.refresh(quote)
    return quote


@router.get("/{quote_id}", response_model=QuoteResponse)
def get_quote(
    quote_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    quote = db.query(Quote).filter(Quote.id == quote_id).first()
    if not quote:
        raise HTTPException(status_code=404, detail="Presupuesto no encontrado")
    ensure_owner_or_admin(current_user, quote.created_by)
    before = {
        field: getattr(quote, field)
        for field in [
            "client_id", "client_name", "client_phone", "items", "discount_usd",
            "status", "valid_until", "notes",
        ]
    }
    return quote


@router.patch("/{quote_id}", response_model=QuoteResponse)
def update_quote(
    quote_id: int,
    data: QuoteUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    quote = db.query(Quote).filter(Quote.id == quote_id).first()
    if not quote:
        raise HTTPException(status_code=404, detail="Presupuesto no encontrado")
    ensure_owner_or_admin(current_user, quote.created_by)
    if "client_id" in data.model_fields_set:
        client = _get_accessible_client(data.client_id, db, current_user)
        quote.client_id = client.id if client else None
        if client:
            quote.client_name = client.name
            quote.client_phone = client.phone

    if data.items is not None:
        discount = data.discount_usd if data.discount_usd is not None else Decimal(str(quote.discount_usd))
        subtotal, total = _calc_totals(data.items, discount)
        quote.items = [i.model_dump(mode="json") for i in data.items]
        quote.subtotal_usd = subtotal
        quote.total_usd = total
    elif data.discount_usd is not None:
        from app.schemas.quote import QuoteItem
        items = [QuoteItem(**i) for i in quote.items]
        subtotal, total = _calc_totals(items, data.discount_usd)
        quote.subtotal_usd = subtotal
        quote.total_usd = total

    linked_to_client = quote.client_id is not None
    for field in ["client_name", "client_phone", "discount_usd", "status", "valid_until", "notes"]:
        if linked_to_client and field in {"client_name", "client_phone"}:
            continue
        val = getattr(data, field, None)
        if val is not None:
            setattr(quote, field, val)

    changes = {
        field: {"old": old_value, "new": getattr(quote, field)}
        for field, old_value in before.items()
        if old_value != getattr(quote, field)
    }
    if changes:
        record_audit(
            db,
            entity_type="quote",
            entity_id=quote.id,
            user=current_user,
            action="updated",
            changes=changes,
        )

    db.commit()
    db.refresh(quote)
    return quote


@router.delete("/{quote_id}")
def delete_quote(
    quote_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    quote = db.query(Quote).filter(Quote.id == quote_id).first()
    if not quote:
        raise HTTPException(status_code=404, detail="Presupuesto no encontrado")
    ensure_owner_or_admin(current_user, quote.created_by)
    move_to_trash(
        db,
        entity_type="quote",
        entity_id=quote.id,
        label=f"Presupuesto #{quote.id} · {quote.client_name}",
        user=current_user,
        payload={"record": {
            "client_id": quote.client_id,
            "client_name": quote.client_name,
            "client_phone": quote.client_phone,
            "items": quote.items,
            "subtotal_usd": quote.subtotal_usd,
            "discount_usd": quote.discount_usd,
            "total_usd": quote.total_usd,
            "status": quote.status,
            "valid_until": quote.valid_until,
            "notes": quote.notes,
            "created_by": quote.created_by,
        }},
    )
    db.delete(quote)
    db.commit()
    return {"ok": True}
