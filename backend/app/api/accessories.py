from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.db.session import get_db
from app.models.accessory import Accessory, AccessorySale, Combo, ComboItem
from app.schemas.accessory import (
    AccessoryCreate, AccessoryUpdate, AccessoryResponse,
    AddStockRequest, SellRequest, AccessorySaleResponse,
    ComboCreate, ComboResponse, SellComboRequest,
)

router = APIRouter(prefix="/accessories", tags=["Accessories"])


# ── Accesorios ───────────────────────────────────────────────────────────────

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
        raise HTTPException(status_code=400, detail=f"Stock insuficiente (disponible: {acc.quantity})")

    sale_price = data.sale_price_usd if data.sale_price_usd is not None else acc.sale_price_usd
    profit = (float(sale_price) - float(acc.purchase_price_usd)) * data.quantity

    sale = AccessorySale(
        accessory_id=acc_id,
        sale_id=data.sale_id,
        quantity_sold=data.quantity,
        sale_price_usd=sale_price,
        purchase_price_usd=acc.purchase_price_usd,
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


# ── Historial global de ventas de accesorios ─────────────────────────────────

@router.get("/sales/all")
def get_all_accessory_sales(db: Session = Depends(get_db)):
    rows = (
        db.query(AccessorySale, Accessory)
        .join(Accessory, AccessorySale.accessory_id == Accessory.id)
        .order_by(AccessorySale.sold_at.desc())
        .all()
    )
    return [
        {
            "id": s.id,
            "accessory_id": s.accessory_id,
            "sale_id": s.sale_id,
            "accessory_name": a.name,
            "accessory_category": a.category,
            "quantity_sold": s.quantity_sold,
            "sale_price_usd": float(s.sale_price_usd),
            "purchase_price_usd": float(s.purchase_price_usd),
            "gross_profit_usd": float(s.gross_profit_usd),
            "notes": s.notes,
            "sold_at": s.sold_at,
        }
        for s, a in rows
    ]


# ── Combos ───────────────────────────────────────────────────────────────────

@router.get("/combos/", response_model=list[ComboResponse])
def list_combos(db: Session = Depends(get_db)):
    return db.query(Combo).order_by(Combo.created_at.desc()).all()


@router.post("/combos/", response_model=ComboResponse)
def create_combo(data: ComboCreate, db: Session = Depends(get_db)):
    combo = Combo(name=data.name, description=data.description, sale_price_usd=data.sale_price_usd)
    db.add(combo)
    db.flush()
    for item in data.items:
        db.add(ComboItem(combo_id=combo.id, accessory_id=item.accessory_id, quantity=item.quantity))
    db.commit()
    db.refresh(combo)
    # load items manually
    combo.items = db.query(ComboItem).filter(ComboItem.combo_id == combo.id).all()
    return combo


@router.put("/combos/{combo_id}", response_model=ComboResponse)
def update_combo(combo_id: int, data: ComboCreate, db: Session = Depends(get_db)):
    combo = db.query(Combo).filter(Combo.id == combo_id).first()
    if not combo:
        raise HTTPException(status_code=404, detail="Combo no encontrado")
    combo.name = data.name
    combo.description = data.description
    combo.sale_price_usd = data.sale_price_usd
    db.query(ComboItem).filter(ComboItem.combo_id == combo_id).delete()
    for item in data.items:
        db.add(ComboItem(combo_id=combo_id, accessory_id=item.accessory_id, quantity=item.quantity))
    db.commit()
    db.refresh(combo)
    combo.items = db.query(ComboItem).filter(ComboItem.combo_id == combo_id).all()
    return combo


@router.delete("/combos/{combo_id}")
def delete_combo(combo_id: int, db: Session = Depends(get_db)):
    combo = db.query(Combo).filter(Combo.id == combo_id).first()
    if not combo:
        raise HTTPException(status_code=404, detail="Combo no encontrado")
    db.query(ComboItem).filter(ComboItem.combo_id == combo_id).delete()
    db.delete(combo)
    db.commit()
    return {"message": "Eliminado"}


@router.post("/combos/{combo_id}/sell")
def sell_combo(combo_id: int, data: SellComboRequest, db: Session = Depends(get_db)):
    combo = db.query(Combo).filter(Combo.id == combo_id).first()
    if not combo:
        raise HTTPException(status_code=404, detail="Combo no encontrado")

    items = db.query(ComboItem).filter(ComboItem.combo_id == combo_id).all()
    if not items:
        raise HTTPException(status_code=400, detail="El combo no tiene artículos")

    # Validate stock first
    for item in items:
        acc = db.query(Accessory).filter(Accessory.id == item.accessory_id).first()
        if not acc or acc.quantity < item.quantity:
            name = acc.name if acc else f"ID {item.accessory_id}"
            raise HTTPException(status_code=400, detail=f"Stock insuficiente para: {name}")

    # Calculate total price
    total_cost = sum(
        float(db.query(Accessory).filter(Accessory.id == item.accessory_id).first().purchase_price_usd) * item.quantity
        for item in items
    )
    override_price = data.override_price_usd
    natural_price = sum(
        float(db.query(Accessory).filter(Accessory.id == item.accessory_id).first().sale_price_usd) * item.quantity
        for item in items
    )
    if combo.sale_price_usd:
        natural_price = float(combo.sale_price_usd)
    if override_price:
        natural_price = float(override_price)

    # Distribute discount proportionally across items
    created = []
    for item in items:
        acc = db.query(Accessory).filter(Accessory.id == item.accessory_id).with_for_update().first()
        unit_price = float(acc.sale_price_usd)
        # use natural price as-is per item (combo discount already reflected in total)
        profit = (unit_price - float(acc.purchase_price_usd)) * item.quantity
        acc_sale = AccessorySale(
            accessory_id=acc.id,
            sale_id=data.sale_id,
            quantity_sold=item.quantity,
            sale_price_usd=unit_price,
            purchase_price_usd=acc.purchase_price_usd,
            gross_profit_usd=profit,
            notes=f"Combo: {combo.name}" + (f" — {data.notes}" if data.notes else ""),
        )
        acc.quantity -= item.quantity
        db.add(acc_sale)
        created.append(acc_sale)

    db.commit()
    return {"message": f"Combo '{combo.name}' vendido", "sales_created": len(created), "total_price_usd": natural_price}
