from decimal import Decimal
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.models.sale_payment import SalePayment
from app.db.session import get_db
from app.models.sale import Sale
from app.models.product import Product
from app.models.user import User
from app.schemas.sale import SaleCreate, SaleResponse

router = APIRouter(prefix="/sales", tags=["Sales"])


@router.post("/", response_model=SaleResponse)
def create_sale(sale_data: SaleCreate, db: Session = Depends(get_db)):
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

    db.commit()
    db.refresh(new_sale)

    return new_sale


@router.get("/", response_model=list[SaleResponse])
def list_sales(db: Session = Depends(get_db)):
    return db.query(Sale).order_by(Sale.id.desc()).all()


@router.get("/{sale_id}", response_model=SaleResponse)
def get_sale(sale_id: int, db: Session = Depends(get_db)):
    sale = db.query(Sale).filter(Sale.id == sale_id).first()
    if not sale:
        raise HTTPException(status_code=404, detail="Venta no encontrada")
    return sale