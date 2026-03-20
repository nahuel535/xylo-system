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
from app.core.dependencies import get_optional_user_id
from app.utils.qr import generate_product_qr

router = APIRouter(prefix="/products", tags=["Products"])


@router.post("/", response_model=ProductResponse)
def create_product(request: Request, product_data: ProductCreate, db: Session = Depends(get_db)):
    existing_product = db.query(Product).filter(Product.imei == product_data.imei).first()
    if existing_product:
        raise HTTPException(status_code=400, detail="Ya existe un producto con ese IMEI")
    new_product = Product(**product_data.model_dump())
    db.add(new_product)
    db.flush()
    user_id = get_optional_user_id(request)
    db.add(AuditLog(entity_type="product", entity_id=new_product.id, user_id=user_id, action="created"))
    db.commit()
    db.refresh(new_product)
    return new_product


@router.get("/", response_model=list[ProductResponse])
def list_products(db: Session = Depends(get_db)):
    return db.query(Product).order_by(Product.id.desc()).all()


@router.get("/{product_id}", response_model=ProductResponse)
def get_product(product_id: int, db: Session = Depends(get_db)):
    product = db.query(Product).filter(Product.id == product_id).first()
    if not product:
        raise HTTPException(status_code=404, detail="Producto no encontrado")
    return product


@router.put("/{product_id}", response_model=ProductResponse)
def update_product(request: Request, product_id: int, product_data: ProductUpdate, db: Session = Depends(get_db)):
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
        user_id = get_optional_user_id(request)
        db.add(AuditLog(entity_type="product", entity_id=product_id, user_id=user_id, action="updated", changes=changes))

    db.commit()
    db.refresh(product)
    return product


@router.delete("/{product_id}")
def delete_product(product_id: int, db: Session = Depends(get_db)):
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
def get_product_history(product_id: int, db: Session = Depends(get_db)):
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
def get_product_qr(product_id: int, db: Session = Depends(get_db)):
    product = db.query(Product).filter(Product.id == product_id).first()
    if not product:
        raise HTTPException(status_code=404, detail="Producto no encontrado")
    buffer = generate_product_qr(product.id)
    return StreamingResponse(
        buffer,
        media_type="image/png",
        headers={"Content-Disposition": f"attachment; filename=product_{product.id}_qr.png"}
    )