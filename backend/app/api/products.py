from datetime import datetime
from typing import Optional

from fastapi import APIRouter, Depends, HTTPException, Request
from fastapi.responses import StreamingResponse
from sqlalchemy.orm import Session

from app.db.session import get_db
from app.models.product import Product
from app.models.sale import Sale
from app.models.sale_payment import SalePayment
from app.models.audit_log import AuditLog
from app.schemas.product import ProductCreate, ProductResponse, ProductUpdate
from app.models.user import User
from app.core.dependencies import get_current_user, get_optional_user_id, require_admin
from app.schemas.after_sales import ReservationCreate
from app.utils.qr import generate_product_qr

router = APIRouter(prefix="/products", tags=["Products"])


def _product_for_user(product: Product, current_user: Optional[User]) -> dict:
    data = ProductResponse.model_validate(product).model_dump()
    if not current_user or current_user.role != "admin":
        for field in ("purchase_price_usd", "purchase_date", "supplier", "created_by"):
            data.pop(field, None)
    can_see_reservation = (
        current_user
        and (
            current_user.role == "admin"
            or product.reserved_by == current_user.id
        )
    )
    if not can_see_reservation:
        for field in ("reserved_for", "reserved_until", "reservation_notes", "reserved_by"):
            data.pop(field, None)
    return data


def _optional_current_user(request: Request, db: Session) -> Optional[User]:
    user_id = get_optional_user_id(request)
    if not user_id:
        return None
    return db.query(User).filter(User.id == user_id, User.is_active == True).first()


@router.post("/", response_model=ProductResponse)
def create_product(
    request: Request,
    product_data: ProductCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_admin),
):
    existing_product = db.query(Product).filter(Product.imei == product_data.imei).first()
    if existing_product:
        raise HTTPException(status_code=400, detail="Ya existe un producto con ese IMEI")
    new_product = Product(**product_data.model_dump())
    db.add(new_product)
    db.flush()
    db.add(AuditLog(entity_type="product", entity_id=new_product.id, user_id=current_user.id, action="created"))
    db.commit()
    db.refresh(new_product)
    return new_product


@router.get("/")
def list_products(
    request: Request,
    db: Session = Depends(get_db),
):
    current_user = _optional_current_user(request, db)
    products = db.query(Product).order_by(Product.id.desc()).all()
    return [_product_for_user(product, current_user) for product in products]


@router.get("/check-imei/{imei}")
def check_product_imei(
    imei: str,
    db: Session = Depends(get_db),
    _: User = Depends(require_admin),
):
    normalized_imei = "".join(character for character in imei if character.isdigit())
    if len(normalized_imei) != 15:
        raise HTTPException(status_code=400, detail="El IMEI debe tener exactamente 15 dígitos")

    product = db.query(Product).filter(Product.imei == normalized_imei).first()
    if not product:
        return {"exists": False, "product": None}

    return {
        "exists": True,
        "product": {
            "id": product.id,
            "model": product.model,
            "storage": product.storage,
            "color": product.color,
            "status": product.status,
        },
    }


@router.get("/{product_id}")
def get_product(
    request: Request,
    product_id: int,
    db: Session = Depends(get_db),
):
    current_user = _optional_current_user(request, db)
    product = db.query(Product).filter(Product.id == product_id).first()
    if not product:
        raise HTTPException(status_code=404, detail="Producto no encontrado")
    return _product_for_user(product, current_user)


@router.put("/{product_id}", response_model=ProductResponse)
def update_product(
    request: Request,
    product_id: int,
    product_data: ProductUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_admin),
):
    product = db.query(Product).filter(Product.id == product_id).first()
    if not product:
        raise HTTPException(status_code=404, detail="Producto no encontrado")
    if product_data.created_by is not None:
        user_exists = db.query(User).filter(User.id == product_data.created_by).first()
        if not user_exists:
            raise HTTPException(status_code=400, detail="El usuario created_by no existe")

    # Detectar cambios
    tracked = ["model", "storage", "color", "imei", "serial_number", "battery_health",
               "purchase_price_usd", "suggested_sale_price_usd", "cosmetic_condition",
               "functional_condition", "notes", "status", "supplier"]
    changes = {}
    new_data = product_data.model_dump()
    for field in tracked:
        old_val = str(getattr(product, field, "") or "")
        new_val = str(new_data.get(field, "") or "")
        if old_val != new_val:
            changes[field] = {"old": old_val, "new": new_val}

    for key, value in new_data.items():
        setattr(product, key, value)

    if product_data.purchase_price_usd is not None:
        sale = db.query(Sale).filter(Sale.product_id == product_id).first()
        if sale:
            new_cost = product_data.purchase_price_usd
            sale.purchase_price_usd_snapshot = new_cost
            sale.gross_profit_usd = float(sale.sale_price_usd) - float(new_cost)

    if changes:
        db.add(AuditLog(entity_type="product", entity_id=product_id, user_id=current_user.id, action="updated", changes=changes))

    db.commit()
    db.refresh(product)
    return product


@router.post("/{product_id}/reserve")
def reserve_product(
    product_id: int,
    data: ReservationCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    product = db.query(Product).filter(Product.id == product_id).first()
    if not product:
        raise HTTPException(status_code=404, detail="Producto no encontrado")
    if product.status != "in_stock":
        raise HTTPException(status_code=400, detail="El producto no está disponible para reservar")
    comparison_now = (
        datetime.now(data.reserved_until.tzinfo)
        if data.reserved_until.tzinfo
        else datetime.now()
    )
    if data.reserved_until <= comparison_now:
        raise HTTPException(status_code=400, detail="La fecha límite debe ser futura")

    product.status = "reserved"
    product.reserved_for = " ".join(data.client_name.split())
    product.reserved_until = data.reserved_until
    product.reservation_notes = data.notes
    product.reserved_by = current_user.id
    db.add(AuditLog(
        entity_type="product",
        entity_id=product.id,
        user_id=current_user.id,
        action="reserved",
        changes={
            "reserved_for": {"new": product.reserved_for},
            "reserved_until": {"new": data.reserved_until.isoformat()},
        },
    ))
    db.commit()
    db.refresh(product)
    return _product_for_user(product, current_user)


@router.post("/{product_id}/release")
def release_product(
    product_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    product = db.query(Product).filter(Product.id == product_id).first()
    if not product:
        raise HTTPException(status_code=404, detail="Producto no encontrado")
    if product.status != "reserved":
        raise HTTPException(status_code=400, detail="El producto no está reservado")
    if current_user.role != "admin" and product.reserved_by != current_user.id:
        raise HTTPException(status_code=403, detail="Solo quien reservó el producto puede liberarlo")

    product.status = "in_stock"
    product.reserved_for = None
    product.reserved_until = None
    product.reservation_notes = None
    product.reserved_by = None
    db.add(AuditLog(
        entity_type="product",
        entity_id=product.id,
        user_id=current_user.id,
        action="reservation_released",
    ))
    db.commit()
    db.refresh(product)
    return _product_for_user(product, current_user)


@router.delete("/{product_id}")
def delete_product(
    product_id: int,
    db: Session = Depends(get_db),
    _: User = Depends(require_admin),
):
    product = db.query(Product).filter(Product.id == product_id).first()
    if not product:
        raise HTTPException(status_code=404, detail="Producto no encontrado")

    # Eliminar pagos primero, luego ventas, luego producto
    sales = db.query(Sale).filter(Sale.product_id == product_id).all()
    for sale in sales:
        db.query(SalePayment).filter(SalePayment.sale_id == sale.id).delete()
        db.delete(sale)

    db.flush()
    db.delete(product)
    db.commit()
    return {"message": "Producto eliminado correctamente"}


@router.get("/{product_id}/history")
def get_product_history(
    product_id: int,
    db: Session = Depends(get_db),
    _: User = Depends(require_admin),
):
    logs = (
        db.query(AuditLog, User)
        .outerjoin(User, AuditLog.user_id == User.id)
        .filter(AuditLog.entity_type == "product", AuditLog.entity_id == product_id)
        .order_by(AuditLog.created_at.desc())
        .all()
    )
    return [
        {
            "id": log.id,
            "action": log.action,
            "changes": log.changes,
            "user_name": user.name if user else "Sistema",
            "created_at": log.created_at,
        }
        for log, user in logs
    ]


@router.get("/{product_id}/qr")
def get_product_qr(
    product_id: int,
    db: Session = Depends(get_db),
):
    product = db.query(Product).filter(Product.id == product_id).first()
    if not product:
        raise HTTPException(status_code=404, detail="Producto no encontrado")
    buffer = generate_product_qr(product.id)
    return StreamingResponse(
        buffer,
        media_type="image/png",
        headers={"Content-Disposition": f"attachment; filename=product_{product.id}_qr.png"}
    )
