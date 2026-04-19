from decimal import Decimal
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.db.session import get_db
from app.models.exchange_rate_model import ExchangeRate
from app.schemas.exchange_rate import (
    ExchangeRateCreate,
    ExchangeRateUpdate,
    ExchangeRateResponse,
    ActiveExchangeRateResponse,
)
from app.services.exchange_sync import fetch_and_sync

router = APIRouter(prefix="/exchange-rates", tags=["Exchange Rates"])


@router.post("/", response_model=ExchangeRateResponse)
def create_exchange_rate(data: ExchangeRateCreate, db: Session = Depends(get_db)):
    if data.is_active:
        db.query(ExchangeRate).update({ExchangeRate.is_active: False})

    new_rate = ExchangeRate(**data.dict())
    db.add(new_rate)
    db.commit()
    db.refresh(new_rate)
    return new_rate


@router.get("/", response_model=list[ExchangeRateResponse])
def list_exchange_rates(db: Session = Depends(get_db)):
    return db.query(ExchangeRate).order_by(ExchangeRate.updated_at.desc()).all()


@router.get("/active", response_model=ActiveExchangeRateResponse)
def get_active_exchange_rate(db: Session = Depends(get_db)):
    rate = (
        db.query(ExchangeRate)
        .filter(ExchangeRate.is_active == True)
        .order_by(ExchangeRate.updated_at.desc())
        .first()
    )

    if not rate:
        raise HTTPException(status_code=404, detail="No hay cotización activa")

    if rate.manual_override:
        buy = rate.manual_buy_rate_ars if rate.manual_buy_rate_ars is not None else rate.buy_rate_ars
        sell = rate.manual_sell_rate_ars if rate.manual_sell_rate_ars is not None else rate.sell_rate_ars
        mode = "manual"
    else:
        buy = rate.buy_rate_ars
        sell = rate.sell_rate_ars
        mode = "automatic"

    return ActiveExchangeRateResponse(
        source_name=rate.source_name,
        buy_rate_ars=Decimal(buy),
        sell_rate_ars=Decimal(sell),
        mode=mode,
        updated_at=rate.updated_at,
    )


@router.post("/sync", response_model=ExchangeRateResponse)
async def sync_blue_rate(db: Session = Depends(get_db)):
    try:
        rate = await fetch_and_sync(db)
        return rate
    except Exception as e:
        raise HTTPException(status_code=502, detail=f"Error al sincronizar: {str(e)}")


@router.put("/{rate_id}", response_model=ExchangeRateResponse)
def update_exchange_rate(rate_id: int, data: ExchangeRateUpdate, db: Session = Depends(get_db)):
    rate = db.query(ExchangeRate).filter(ExchangeRate.id == rate_id).first()

    if not rate:
        raise HTTPException(status_code=404, detail="Cotización no encontrada")

    update_data = data.dict(exclude_unset=True)

    if update_data.get("is_active") is True:
        db.query(ExchangeRate).update({ExchangeRate.is_active: False})

    for key, value in update_data.items():
        setattr(rate, key, value)

    db.commit()
    db.refresh(rate)
    return rate