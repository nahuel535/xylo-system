from datetime import datetime, date
from decimal import Decimal
from fastapi import APIRouter, Depends
from sqlalchemy import func
from sqlalchemy.orm import Session

from app.db.session import get_db
from app.models.product import Product
from app.models.sale import Sale
from app.models.sale_payment import SalePayment
from app.schemas.dashboard import DashboardSummary

router = APIRouter(prefix="/dashboard", tags=["Dashboard"])


@router.get("/summary", response_model=DashboardSummary)
def get_dashboard_summary(db: Session = Depends(get_db)):
    today = date.today()
    now = datetime.now()

    month_start = datetime(now.year, now.month, 1)

    total_products_in_stock = db.query(Product).filter(Product.status == "in_stock").count()

    total_stock_value_usd = (
        db.query(func.coalesce(func.sum(Product.purchase_price_usd), 0))
        .filter(Product.status == "in_stock")
        .scalar()
    )

    total_sales_count = db.query(Sale).count()

    total_sales_value_usd = (
        db.query(func.coalesce(func.sum(Sale.sale_price_usd), 0))
        .scalar()
    )

    total_gross_profit_usd = (
        db.query(func.coalesce(func.sum(Sale.gross_profit_usd), 0))
        .scalar()
    )

    sales_today_count = (
        db.query(Sale)
        .filter(func.date(Sale.sale_date) == today)
        .count()
    )

    sales_today_value_usd = (
        db.query(func.coalesce(func.sum(Sale.sale_price_usd), 0))
        .filter(func.date(Sale.sale_date) == today)
        .scalar()
    )

    sales_this_month_count = (
        db.query(Sale)
        .filter(Sale.sale_date >= month_start)
        .count()
    )

    sales_this_month_value_usd = (
        db.query(func.coalesce(func.sum(Sale.sale_price_usd), 0))
        .filter(Sale.sale_date >= month_start)
        .scalar()
    )

    return DashboardSummary(
        total_products_in_stock=total_products_in_stock,
        total_stock_value_usd=Decimal(total_stock_value_usd),
        total_sales_count=total_sales_count,
        total_sales_value_usd=Decimal(total_sales_value_usd),
        total_gross_profit_usd=Decimal(total_gross_profit_usd),
        sales_today_count=sales_today_count,
        sales_today_value_usd=Decimal(sales_today_value_usd),
        sales_this_month_count=sales_this_month_count,
        sales_this_month_value_usd=Decimal(sales_this_month_value_usd),
    )
    
@router.get("/payment-methods")
def get_payment_methods_summary(db: Session = Depends(get_db)):
    results = (
        db.query(
            SalePayment.method,
            func.count(SalePayment.id).label("count"),
            func.coalesce(func.sum(SalePayment.amount_usd), 0).label("total_usd")
        )
        .group_by(SalePayment.method)
        .order_by(func.sum(SalePayment.amount_usd).desc())
        .all()
    )

    return [
        {
            "method": row.method,
            "count": row.count,
            "total_usd": float(row.total_usd)
        }
        for row in results
    ]
    
@router.get("/top-models")
def get_top_models(db: Session = Depends(get_db)):
    results = (
        db.query(
            Product.model,
            func.count(Sale.id).label("sales_count"),
            func.coalesce(func.sum(Sale.sale_price_usd), 0).label("total_sales_usd")
        )
        .join(Sale, Sale.product_id == Product.id)
        .group_by(Product.model)
        .order_by(func.count(Sale.id).desc())
        .all()
    )

    return [
        {
            "model": row.model,
            "sales_count": row.sales_count,
            "total_sales_usd": float(row.total_sales_usd)
        }
        for row in results
    ]