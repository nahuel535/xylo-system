from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.db.session import get_db
from app.models.accessory import Accessory, AccessorySale
from app.schemas.accessory import (
    AccessoryCreate, AccessoryUpdate, AccessoryResponse,
    AddStockRequest, SellRequest, AccessorySaleResponse,
)

router = APIRouter(prefix="/accessories", tags=["Accessories"])


@router.get("/", response_model=list[AccessoryResponse])
def list_accessories(db: Session = Depends(get_db)):
    return db.query(Accessory).order_by(Accessory.created_at.desc()).all()


@router.post("/", response_model=AccessoryResponse)
def create_accessory(data: AccessoryCreate, db: Session = Depends(get_db)):
    acc = Accessory(**data.model_dump())
    db.add(acc)
    db.commit()
    db.refresh(acc)
    return acc


@router.put("/{acc_id}", response_model=AccessoryResponse)
def update_accessory(acc_id: int, data: AccessoryUpdate, db: Session = Depends(get_db)):
    acc = db.query(Accessory).filter(Accessory.id == acc_id).first()
    if not acc:
        raise HTTPException(status_code=404, detail="Accesorio no encontrado")
    for k, v in data.model_dump().items():
        setattr(acc, k, v)
    db.commit()
    db.refresh(acc)
    return acc


@router.delete("/{acc_id}")
def delete_accessory(acc_id: int, db: Session = Depends(get_db)):
    acc = db.query(Accessory).filter(Accessory.id == acc_id).first()
    if not acc:
        raise HTTPException(status_code=404, detail="Accesorio no encontrado")
    db.query(AccessorySale).filter(AccessorySale.accessory_id == acc_id).delete()
    db.delete(acc)
    db.commit()
    return {"message": "Eliminado"}


@router.post("/{acc_id}/stock", response_model=AccessoryResponse)
def add_stock(acc_id: int, data: AddStockRequest, db: Session = Depends(get_db)):
    acc = db.query(Accessory).filter(Accessory.id == acc_id).first()
    if not acc:
        raise HTTPException(status_code=404, detail="Accesorio no encontrado")
    if data.quantity <= 0:
        raise HTTPException(status_code=400, detail="Cantidad inválida")
    acc.quantity += data.quantity
    if data.purchase_price_usd is not None:
        acc.purchase_price_usd = data.purchase_price_usd
    db.commit()
    db.refresh(acc)
    return acc


@router.post("/{acc_id}/sell", response_model=AccessorySaleResponse)
def sell_accessory(acc_id: int, data: SellRequest, db: Session = Depends(get_db)):
    acc = db.query(Accessory).filter(Accessory.id == acc_id).first()
    if not acc:
        raise HTTPException(status_code=404, detail="Accesorio no encontrado")
    if data.quantity <= 0:
        raise HTTPException(status_code=400, detail="Cantidad inválida")
    if acc.quantity < data.quantity:
        raise HTTPException(
            status_code=400,
            detail=f"Stock insuficiente (disponible: {acc.quantity})",
        )

    sale_price = data.sale_price_usd if data.sale_price_usd is not None else acc.sale_price_usd
    purchase_price = acc.purchase_price_usd
    profit = (float(sale_price) - float(purchase_price)) * data.quantity

    sale = AccessorySale(
        accessory_id=acc_id,
        quantity_sold=data.quantity,
        sale_price_usd=sale_price,
        purchase_price_usd=purchase_price,
        gross_profit_usd=profit,
        notes=data.notes,
    )
    acc.quantity -= data.quantity
    db.add(sale)
    db.commit()
    db.refresh(sale)
    return sale


@router.get("/{acc_id}/sales", response_model=list[AccessorySaleResponse])
def get_accessory_sales(acc_id: int, db: Session = Depends(get_db)):
    return (
        db.query(AccessorySale)
        .filter(AccessorySale.accessory_id == acc_id)
        .order_by(AccessorySale.sold_at.desc())
        .all()
    )
