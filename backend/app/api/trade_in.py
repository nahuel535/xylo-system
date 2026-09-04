from typing import List, Optional

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session

from app.core.dependencies import get_current_user, require_admin_or_technician
from app.db.session import get_db
from app.models.part_price import PartPrice
from app.models.trade_in_price import TradeInBasePrice
from app.models.user import User
from app.schemas.trade_in_price import (
    PartDeductionDetail,
    TradeInBasePriceCreate,
    TradeInBasePriceResponse,
    TradeInBasePriceUpdate,
    TradeInQuoteRequest,
    TradeInQuoteResponse,
)

router = APIRouter(prefix="/trade-in", tags=["Cotizador"])


@router.get("/base-prices", response_model=List[TradeInBasePriceResponse])
def list_base_prices(
    model: Optional[str] = Query(None),
    db: Session = Depends(get_db),
    _: User = Depends(get_current_user),
):
    query = db.query(TradeInBasePrice)
    if model:
        query = query.filter(TradeInBasePrice.model.ilike(f"%{model}%"))
    return query.order_by(TradeInBasePrice.model.asc(), TradeInBasePrice.storage.asc(), TradeInBasePrice.battery_min.asc()).all()


@router.get("/models", response_model=List[str])
def list_models(
    db: Session = Depends(get_db),
    _: User = Depends(get_current_user),
):
    """Lista de modelos únicos, para armar el selector del cotizador."""
    rows = db.query(TradeInBasePrice.model).distinct().order_by(TradeInBasePrice.model.asc()).all()
    return [row[0] for row in rows]


@router.get("/storages", response_model=List[str])
def list_storages_for_model(
    model: str = Query(...),
    db: Session = Depends(get_db),
    _: User = Depends(get_current_user),
):
    rows = (
        db.query(TradeInBasePrice.storage)
        .filter(TradeInBasePrice.model == model)
        .distinct()
        .order_by(TradeInBasePrice.storage.asc())
        .all()
    )
    return [row[0] for row in rows]


@router.post("/base-prices", response_model=TradeInBasePriceResponse)
def create_base_price(
    data: TradeInBasePriceCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_admin_or_technician),
):
    if data.battery_min > data.battery_max:
        raise HTTPException(status_code=400, detail="El % de batería mínimo no puede ser mayor al máximo")
    price = TradeInBasePrice(
        model=data.model.strip(),
        storage=data.storage.strip(),
        battery_min=data.battery_min,
        battery_max=data.battery_max,
        price_usd=data.price_usd,
        notes=data.notes,
        updated_by=current_user.id,
    )
    db.add(price)
    db.commit()
    db.refresh(price)
    return price


@router.patch("/base-prices/{price_id}", response_model=TradeInBasePriceResponse)
def update_base_price(
    price_id: int,
    data: TradeInBasePriceUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_admin_or_technician),
):
    price = db.query(TradeInBasePrice).filter(TradeInBasePrice.id == price_id).first()
    if not price:
        raise HTTPException(status_code=404, detail="Precio no encontrado")
    for field, value in data.model_dump(exclude_unset=True).items():
        setattr(price, field, value)
    if price.battery_min > price.battery_max:
        raise HTTPException(status_code=400, detail="El % de batería mínimo no puede ser mayor al máximo")
    price.updated_by = current_user.id
    db.commit()
    db.refresh(price)
    return price


@router.delete("/base-prices/{price_id}")
def delete_base_price(
    price_id: int,
    db: Session = Depends(get_db),
    _: User = Depends(require_admin_or_technician),
):
    price = db.query(TradeInBasePrice).filter(TradeInBasePrice.id == price_id).first()
    if not price:
        raise HTTPException(status_code=404, detail="Precio no encontrado")
    db.delete(price)
    db.commit()
    return {"ok": True}


@router.post("/quote", response_model=TradeInQuoteResponse)
def calculate_trade_in_quote(
    data: TradeInQuoteRequest,
    db: Session = Depends(get_db),
    _: User = Depends(get_current_user),
):
    base_row = (
        db.query(TradeInBasePrice)
        .filter(
            TradeInBasePrice.model == data.model,
            TradeInBasePrice.storage == data.storage,
            TradeInBasePrice.battery_min <= data.battery_health,
            TradeInBasePrice.battery_max >= data.battery_health,
        )
        .first()
    )
    if not base_row:
        raise HTTPException(
            status_code=404,
            detail=f"No hay precio base cargado para {data.model} {data.storage} con {data.battery_health}% de batería",
        )

    deductions: List[PartDeductionDetail] = []
    for item in data.parts:
        part = db.query(PartPrice).filter(PartPrice.id == item.part_price_id).first()
        if not part:
            raise HTTPException(status_code=404, detail=f"Pieza {item.part_price_id} no encontrada")
        deductions.append(PartDeductionDetail(
            part_price_id=part.id,
            category=part.category,
            label=part.label,
            price_usd=part.price_usd,
        ))

    total_deductions = sum((d.price_usd for d in deductions), start=type(base_row.price_usd)("0"))
    final_price = base_row.price_usd - total_deductions
    if final_price < 0:
        final_price = type(base_row.price_usd)("0")

    return TradeInQuoteResponse(
        model=data.model,
        storage=data.storage,
        battery_health=data.battery_health,
        base_price_usd=base_row.price_usd,
        deductions=deductions,
        total_deductions_usd=total_deductions,
        final_price_usd=final_price,
    )
