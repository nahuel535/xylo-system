from decimal import Decimal
from fastapi import APIRouter, Depends, HTTPException, Request
from sqlalchemy.orm import Session
from app.models.sale_payment import SalePayment
from app.models.audit_log import AuditLog
from app.db.session import get_db
from app.models.sale import Sale
from app.models.product import Product
from app.models.user import User
from app.schemas.sale import SaleCreate, SaleUpdate, SaleResponse
from app.core.dependencies import get_optional_user_id

router = APIRouter(prefix="/sales", tags=["Sales"])


@router.post("/", response_model=SaleResponse)
def create_sale(request: Request, sale_data: SaleCreate, db: Session = Depends(get_db)):
    product = db.query(Product).filter(Product.id == sale_data.product_id).first()
    if not product:
        raise HTTPException(status_code=404, detail="Producto no encontrado")

    if product.status != "in_stock":
        raise HTTPException(status_code=400, detail="El producto no está disponible para la venta")

    seller = db.query(User).filter(User.id == sale_data.seller_id).first()
    if not seller:
        raise HTTPException(status_code=404, detail="Vendedor no encontrado")

    purchase_price = Decimal(product.purchase_price_usd)
    sale_price = Decimal(sale_data.sale_price_usd)
    gross_profit = sale_price - purchase_price

    total_payments = sum(Decimal(payment.amount_usd) for payment in sale_data.payments)

    if sale_data.payments and total_payments != sale_price:
        raise HTTPException(
            status_code=400,
            detail=f"La suma de los pagos ({total_payments}) no coincide con el precio de venta ({sale_price})"
        )

    new_sale = Sale(
        product_id=sale_data.product_id,
        seller_id=sale_data.seller_id,
        sale_price_usd=sale_price,
        purchase_price_usd_snapshot=purchase_price,
        gross_profit_usd=gross_profit,
        client_name=sale_data.client_name,
        notes=sale_data.notes,
        status=sale_data.status,
        has_trade_in=sale_data.has_trade_in,
        trade_in_value_usd=sale_data.trade_in_value_usd,
        has_deposit=sale_data.has_deposit,
        deposit_amount_usd=sale_data.deposit_amount_usd,
        remaining_balance_usd=sale_data.remaining_balance_usd,
    )

    db.add(new_sale)
    db.flush()

    for payment in sale_data.payments:
        new_payment = SalePayment(
            sale_id=new_sale.id,
            method=payment.method,
            amount_usd=payment.amount_usd,
            installments=payment.installments,
            surcharge_usd=payment.surcharge_usd,
            commission_usd=payment.commission_usd,
            reference=payment.reference,
        )
        db.add(new_payment)

    product.status = "sold"

    user_id = get_optional_user_id(request)
    db.add(AuditLog(entity_type="sale", entity_id=new_sale.id, user_id=user_id, action="created"))

    db.commit()
    db.refresh(new_sale)

    return new_sale


@router.put("/{sale_id}", response_model=SaleResponse)
def update_sale(request: Request, sale_id: int, sale_data: SaleUpdate, db: Session = Depends(get_db)):
    sale = db.query(Sale).filter(Sale.id == sale_id).first()
    if not sale:
        raise HTTPException(status_code=404, detail="Venta no encontrada")

    if sale_data.seller_id is not None:
        seller = db.query(User).filter(User.id == sale_data.seller_id).first()
        if not seller:
            raise HTTPException(status_code=400, detail="Vendedor no encontrado")
        sale.seller_id = sale_data.seller_id

    if sale_data.sale_price_usd is not None:
        sale.sale_price_usd = sale_data.sale_price_usd
        sale.gross_profit_usd = Decimal(sale_data.sale_price_usd) - Decimal(sale.purchase_price_usd_snapshot)

    if sale_data.client_name is not None:
        sale.client_name = sale_data.client_name
    if sale_data.notes is not None:
        sale.notes = sale_data.notes
    if sale_data.has_trade_in is not None:
        sale.has_trade_in = sale_data.has_trade_in
    if sale_data.trade_in_value_usd is not None:
        sale.trade_in_value_usd = sale_data.trade_in_value_usd
    if sale_data.has_deposit is not None:
        sale.has_deposit = sale_data.has_deposit
    if sale_data.deposit_amount_usd is not None:
        sale.deposit_amount_usd = sale_data.deposit_amount_usd
    if sale_data.remaining_balance_usd is not None:
        sale.remaining_balance_usd = sale_data.remaining_balance_usd
    if sale_data.status is not None:
        sale.status = sale_data.status

    if sale_data.payments is not None:
        db.query(SalePayment).filter(SalePayment.sale_id == sale_id).delete()
        for payment in sale_data.payments:
            db.add(SalePayment(
                sale_id=sale_id,
                method=payment.method,
                amount_usd=payment.amount_usd,
                installments=payment.installments,
                surcharge_usd=payment.surcharge_usd,
                commission_usd=payment.commission_usd,
                reference=payment.reference,
            ))

    # Detectar campos modificados para el log
    tracked = ["sale_price_usd", "seller_id", "client_name", "notes", "status",
               "has_trade_in", "trade_in_value_usd", "has_deposit",
               "deposit_amount_usd", "remaining_balance_usd"]
    changes = {}
    for field in tracked:
        new_val = getattr(sale_data, field, None)
        if new_val is not None:
            old_val = getattr(sale, field, None)
            if str(old_val or "") != str(new_val or ""):
                changes[field] = {"old": str(old_val or ""), "new": str(new_val or "")}

    user_id = get_optional_user_id(request)
    db.add(AuditLog(entity_type="sale", entity_id=sale_id, user_id=user_id, action="updated", changes=changes or None))

    db.commit()
    db.refresh(sale)
    return sale


@router.get("/{sale_id}/history")
def get_sale_history(sale_id: int, db: Session = Depends(get_db)):
    logs = (
        db.query(AuditLog, User)
        .outerjoin(User, AuditLog.user_id == User.id)
        .filter(AuditLog.entity_type == "sale", AuditLog.entity_id == sale_id)
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


@router.get("/", response_model=list[SaleResponse])
def list_sales(db: Session = Depends(get_db)):
    return db.query(Sale).order_by(Sale.id.desc()).all()


@router.get("/{sale_id}", response_model=SaleResponse)
def get_sale(sale_id: int, db: Session = Depends(get_db)):
    sale = db.query(Sale).filter(Sale.id == sale_id).first()
    if not sale:
        raise HTTPException(status_code=404, detail="Venta no encontrada")
    return sale