from collections import defaultdict
from decimal import Decimal, ROUND_FLOOR, ROUND_HALF_UP

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.db.session import get_db
from app.models.accessory import Accessory, AccessorySale, Combo, ComboItem
from app.schemas.accessory import (
    AccessoryCreate, AccessoryUpdate, AccessoryResponse,
    AddStockRequest, SellRequest, AccessorySaleResponse, AccessorySaleUpdate,
    ComboCreate, ComboResponse, SellComboRequest,
)
from app.core.dependencies import require_admin

router = APIRouter(prefix="/accessories", tags=["Accessories"], dependencies=[Depends(require_admin)])


def _allocate_combo_unit_prices(accessories_by_item, target_total: Decimal):
    units = [
        (accessory, Decimal(str(accessory.sale_price_usd)))
        for accessory, quantity in accessories_by_item
        for _ in range(quantity)
    ]
    if not units:
        return []

    target_cents = int(
        (target_total * 100).quantize(Decimal("1"), rounding=ROUND_HALF_UP)
    )
    total_weight = sum((weight for _, weight in units), Decimal("0"))
    if total_weight > 0:
        raw_allocations = [
            Decimal(target_cents) * weight / total_weight
            for _, weight in units
        ]
    else:
        raw_allocations = [Decimal(target_cents) / len(units) for _ in units]

    allocated_cents = [
        int(value.to_integral_value(rounding=ROUND_FLOOR))
        for value in raw_allocations
    ]
    remainder_order = sorted(
        range(len(units)),
        key=lambda index: raw_allocations[index] - allocated_cents[index],
        reverse=True,
    )
    for index in remainder_order[:target_cents - sum(allocated_cents)]:
        allocated_cents[index] += 1

    grouped = defaultdict(int)
    for (accessory, _), cents in zip(units, allocated_cents):
        grouped[(accessory.id, cents)] += 1
    return grouped


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


@router.put("/sales/{sale_id}", response_model=AccessorySaleResponse)
def update_accessory_sale(sale_id: int, data: AccessorySaleUpdate, db: Session = Depends(get_db)):
    sale = db.query(AccessorySale).filter(AccessorySale.id == sale_id).first()
    if not sale:
        raise HTTPException(status_code=404, detail="Venta de accesorio no encontrada")
    if data.sale_price_usd is not None:
        sale.sale_price_usd = data.sale_price_usd
        sale.gross_profit_usd = (float(data.sale_price_usd) - float(sale.purchase_price_usd)) * sale.quantity_sold
    sale.notes = data.notes
    db.commit()
    db.refresh(sale)
    return sale


@router.delete("/sales/{sale_id}")
def delete_accessory_sale(sale_id: int, db: Session = Depends(get_db)):
    sale = db.query(AccessorySale).filter(AccessorySale.id == sale_id).first()
    if not sale:
        raise HTTPException(status_code=404, detail="Venta de accesorio no encontrada")
    acc = db.query(Accessory).filter(Accessory.id == sale.accessory_id).first()
    if acc:
        acc.quantity += sale.quantity_sold
    db.delete(sale)
    db.commit()
    return {"message": "Venta eliminada"}


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

    required_by_accessory = defaultdict(int)
    for item in items:
        if item.quantity <= 0:
            raise HTTPException(status_code=400, detail="El combo contiene una cantidad inválida")
        required_by_accessory[item.accessory_id] += item.quantity

    accessories_by_item = []
    for accessory_id, required_quantity in required_by_accessory.items():
        acc = (
            db.query(Accessory)
            .filter(Accessory.id == accessory_id)
            .with_for_update()
            .first()
        )
        if not acc or acc.quantity < required_quantity:
            name = acc.name if acc else f"ID {accessory_id}"
            raise HTTPException(status_code=400, detail=f"Stock insuficiente para: {name}")
        accessories_by_item.append((acc, required_quantity))

    target_total = sum(
        (
            Decimal(str(accessory.sale_price_usd)) * quantity
            for accessory, quantity in accessories_by_item
        ),
        Decimal("0"),
    )
    if combo.sale_price_usd is not None:
        target_total = Decimal(str(combo.sale_price_usd))
    if data.override_price_usd is not None:
        target_total = Decimal(str(data.override_price_usd))
    target_total = target_total.quantize(Decimal("0.01"), rounding=ROUND_HALF_UP)
    if target_total < 0:
        raise HTTPException(status_code=400, detail="El precio del combo no puede ser negativo")

    grouped_prices = _allocate_combo_unit_prices(accessories_by_item, target_total)
    accessories_by_id = {accessory.id: accessory for accessory, _ in accessories_by_item}
    created = []
    quantities_sold = defaultdict(int)
    for (accessory_id, unit_price_cents), quantity in grouped_prices.items():
        acc = accessories_by_id[accessory_id]
        unit_price = Decimal(unit_price_cents) / Decimal("100")
        profit = (unit_price - Decimal(str(acc.purchase_price_usd))) * quantity
        acc_sale = AccessorySale(
            accessory_id=acc.id,
            sale_id=data.sale_id,
            quantity_sold=quantity,
            sale_price_usd=unit_price,
            purchase_price_usd=acc.purchase_price_usd,
            gross_profit_usd=profit,
            notes=f"Combo: {combo.name}" + (f" — {data.notes}" if data.notes else ""),
        )
        db.add(acc_sale)
        created.append(acc_sale)
        quantities_sold[acc.id] += quantity

    for accessory_id, quantity in quantities_sold.items():
        accessories_by_id[accessory_id].quantity -= quantity

    db.commit()
    return {
        "message": f"Combo '{combo.name}' vendido",
        "sales_created": len(created),
        "total_price_usd": float(target_total),
    }
