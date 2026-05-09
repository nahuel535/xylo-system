import csv
import io
from datetime import datetime, date
from decimal import Decimal
from typing import Optional

from fastapi import APIRouter, Depends, Query
from fastapi.responses import Response
from sqlalchemy import extract, func
from sqlalchemy.orm import Session

from app.db.session import get_db
from app.models.product import Product
from app.models.sale import Sale
from app.models.sale_payment import SalePayment
from app.models.expense import Expense
from app.models.debtor import Debtor
from app.models.accessory import Accessory, AccessorySale
from app.schemas.dashboard import DashboardSummary, MonthStat

router = APIRouter(prefix="/dashboard", tags=["Dashboard"])

MONTHS_ES = ["", "Ene", "Feb", "Mar", "Abr", "May", "Jun",
             "Jul", "Ago", "Sep", "Oct", "Nov", "Dic"]
MONTHS_ES_FULL = ["", "Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio",
                  "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre"]


def _d(val):
    return Decimal(val) if val is not None else Decimal(0)


@router.get("/summary", response_model=DashboardSummary)
def get_dashboard_summary(
    db: Session = Depends(get_db),
    year: Optional[int] = Query(None),
    month: Optional[int] = Query(None),
):
    today = date.today()
    now = datetime.now()

    target_year = year if year else now.year
    target_month = month if month else now.month

    month_start = datetime(target_year, target_month, 1)
    if target_month == 12:
        month_end = datetime(target_year + 1, 1, 1)
    else:
        month_end = datetime(target_year, target_month + 1, 1)

    if target_month == 1:
        last_month_start = datetime(target_year - 1, 12, 1)
        last_month_end = datetime(target_year, 1, 1)
    else:
        last_month_start = datetime(target_year, target_month - 1, 1)
        last_month_end = month_start

    # ── iPhones ──────────────────────────────────────────────────────────────
    total_products_in_stock = db.query(Product).filter(Product.status == "in_stock").count()
    total_stock_value_usd = db.query(func.coalesce(func.sum(Product.purchase_price_usd), 0)).filter(Product.status == "in_stock").scalar()

    iphone_total_count = db.query(Sale).count()
    iphone_total_value = db.query(func.coalesce(func.sum(Sale.sale_price_usd), 0)).scalar()
    iphone_total_profit = db.query(func.coalesce(func.sum(Sale.gross_profit_usd), 0)).scalar()

    iphone_today_count = db.query(Sale).filter(func.date(Sale.sale_date) == today).count()
    iphone_today_value = db.query(func.coalesce(func.sum(Sale.sale_price_usd), 0)).filter(func.date(Sale.sale_date) == today).scalar()

    iphone_month_count = db.query(Sale).filter(Sale.sale_date >= month_start, Sale.sale_date < month_end).count()
    iphone_month_value = db.query(func.coalesce(func.sum(Sale.sale_price_usd), 0)).filter(Sale.sale_date >= month_start, Sale.sale_date < month_end).scalar()
    iphone_month_profit = db.query(func.coalesce(func.sum(Sale.gross_profit_usd), 0)).filter(Sale.sale_date >= month_start, Sale.sale_date < month_end).scalar()
    cost_this_month_usd = db.query(func.coalesce(func.sum(Sale.purchase_price_usd_snapshot), 0)).filter(Sale.sale_date >= month_start, Sale.sale_date < month_end).scalar()

    iphone_last_count = db.query(Sale).filter(Sale.sale_date >= last_month_start, Sale.sale_date < last_month_end).count()
    iphone_last_value = db.query(func.coalesce(func.sum(Sale.sale_price_usd), 0)).filter(Sale.sale_date >= last_month_start, Sale.sale_date < last_month_end).scalar()
    iphone_last_profit = db.query(func.coalesce(func.sum(Sale.gross_profit_usd), 0)).filter(Sale.sale_date >= last_month_start, Sale.sale_date < last_month_end).scalar()

    # ── Accesorios ───────────────────────────────────────────────────────────
    acc_total_count = db.query(AccessorySale).count()
    acc_total_value = db.query(func.coalesce(func.sum(AccessorySale.sale_price_usd * AccessorySale.quantity_sold), 0)).scalar()
    acc_total_profit = db.query(func.coalesce(func.sum(AccessorySale.gross_profit_usd), 0)).scalar()

    acc_today_count = db.query(AccessorySale).filter(func.date(AccessorySale.sold_at) == today).count()
    acc_today_value = db.query(func.coalesce(func.sum(AccessorySale.sale_price_usd * AccessorySale.quantity_sold), 0)).filter(func.date(AccessorySale.sold_at) == today).scalar()

    acc_month_count = db.query(AccessorySale).filter(AccessorySale.sold_at >= month_start, AccessorySale.sold_at < month_end).count()
    acc_month_value = db.query(func.coalesce(func.sum(AccessorySale.sale_price_usd * AccessorySale.quantity_sold), 0)).filter(AccessorySale.sold_at >= month_start, AccessorySale.sold_at < month_end).scalar()
    acc_month_profit = db.query(func.coalesce(func.sum(AccessorySale.gross_profit_usd), 0)).filter(AccessorySale.sold_at >= month_start, AccessorySale.sold_at < month_end).scalar()

    acc_last_count = db.query(AccessorySale).filter(AccessorySale.sold_at >= last_month_start, AccessorySale.sold_at < last_month_end).count()
    acc_last_value = db.query(func.coalesce(func.sum(AccessorySale.sale_price_usd * AccessorySale.quantity_sold), 0)).filter(AccessorySale.sold_at >= last_month_start, AccessorySale.sold_at < last_month_end).scalar()
    acc_last_profit = db.query(func.coalesce(func.sum(AccessorySale.gross_profit_usd), 0)).filter(AccessorySale.sold_at >= last_month_start, AccessorySale.sold_at < last_month_end).scalar()

    # ── Gastos / deudores ────────────────────────────────────────────────────
    expenses_this_month_usd = db.query(func.coalesce(func.sum(Expense.amount_usd), 0)).filter(
        extract("year", Expense.date) == target_year,
        extract("month", Expense.date) == target_month,
    ).scalar()

    active_debtors_count = db.query(Debtor).filter(Debtor.paid == False).count()
    total_active_debt_usd = db.query(func.coalesce(func.sum(Debtor.amount_usd), 0)).filter(Debtor.paid == False).scalar()

    # ── Totales combinados ───────────────────────────────────────────────────
    profit_this_month = _d(iphone_month_profit) + _d(acc_month_profit)
    net_profit_this_month_usd = profit_this_month - _d(expenses_this_month_usd)

    return DashboardSummary(
        total_products_in_stock=total_products_in_stock,
        total_stock_value_usd=_d(total_stock_value_usd),
        total_sales_count=iphone_total_count + acc_total_count,
        total_sales_value_usd=_d(iphone_total_value) + _d(acc_total_value),
        total_gross_profit_usd=_d(iphone_total_profit) + _d(acc_total_profit),
        sales_today_count=iphone_today_count + acc_today_count,
        sales_today_value_usd=_d(iphone_today_value) + _d(acc_today_value),
        sales_this_month_count=iphone_month_count + acc_month_count,
        sales_this_month_value_usd=_d(iphone_month_value) + _d(acc_month_value),
        profit_this_month_usd=profit_this_month,
        cost_this_month_usd=_d(cost_this_month_usd),
        sales_last_month_count=iphone_last_count + acc_last_count,
        sales_last_month_value_usd=_d(iphone_last_value) + _d(acc_last_value),
        profit_last_month_usd=_d(iphone_last_profit) + _d(acc_last_profit),
        expenses_this_month_usd=_d(expenses_this_month_usd),
        net_profit_this_month_usd=net_profit_this_month_usd,
        active_debtors_count=active_debtors_count,
        total_active_debt_usd=_d(total_active_debt_usd),
    )


@router.get("/monthly-stats")
def get_monthly_stats(db: Session = Depends(get_db)):
    iphone_rows = (
        db.query(
            extract("year", Sale.sale_date).label("year"),
            extract("month", Sale.sale_date).label("month"),
            func.count(Sale.id).label("sales_count"),
            func.coalesce(func.sum(Sale.sale_price_usd), 0).label("revenue_usd"),
            func.coalesce(func.sum(Sale.gross_profit_usd), 0).label("profit_usd"),
            func.coalesce(func.sum(Sale.purchase_price_usd_snapshot), 0).label("cost_usd"),
        )
        .group_by("year", "month")
        .all()
    )

    acc_rows = (
        db.query(
            extract("year", AccessorySale.sold_at).label("year"),
            extract("month", AccessorySale.sold_at).label("month"),
            func.count(AccessorySale.id).label("sales_count"),
            func.coalesce(func.sum(AccessorySale.sale_price_usd * AccessorySale.quantity_sold), 0).label("revenue_usd"),
            func.coalesce(func.sum(AccessorySale.gross_profit_usd), 0).label("profit_usd"),
            func.coalesce(func.sum(AccessorySale.purchase_price_usd * AccessorySale.quantity_sold), 0).label("cost_usd"),
        )
        .group_by("year", "month")
        .all()
    )

    merged: dict = {}
    for row in iphone_rows:
        key = (int(row.year), int(row.month))
        merged[key] = {
            "sales_count": row.sales_count,
            "revenue_usd": float(row.revenue_usd),
            "profit_usd": float(row.profit_usd),
            "cost_usd": float(row.cost_usd),
        }
    for row in acc_rows:
        key = (int(row.year), int(row.month))
        if key in merged:
            merged[key]["sales_count"] += row.sales_count
            merged[key]["revenue_usd"] += float(row.revenue_usd)
            merged[key]["profit_usd"] += float(row.profit_usd)
            merged[key]["cost_usd"] += float(row.cost_usd)
        else:
            merged[key] = {
                "sales_count": row.sales_count,
                "revenue_usd": float(row.revenue_usd),
                "profit_usd": float(row.profit_usd),
                "cost_usd": float(row.cost_usd),
            }

    return [
        MonthStat(
            year=y,
            month=m,
            label=f"{MONTHS_ES[m]} {str(y)[2:]}",
            sales_count=v["sales_count"],
            revenue_usd=v["revenue_usd"],
            profit_usd=v["profit_usd"],
            cost_usd=v["cost_usd"],
        )
        for (y, m), v in sorted(merged.items())
    ]


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
    return [{"method": row.method, "count": row.count, "total_usd": float(row.total_usd)} for row in results]


@router.get("/recent-sales")
def get_recent_sales(db: Session = Depends(get_db)):
    iphone_results = (
        db.query(Sale, Product)
        .join(Product, Sale.product_id == Product.id)
        .order_by(Sale.sale_date.desc())
        .limit(8)
        .all()
    )
    iphone_list = [
        {
            "id": sale.id,
            "type": "iphone",
            "model": product.model,
            "client_name": sale.client_name,
            "sale_price_usd": float(sale.sale_price_usd),
            "gross_profit_usd": float(sale.gross_profit_usd),
            "sale_date": sale.sale_date,
        }
        for sale, product in iphone_results
    ]

    acc_results = (
        db.query(AccessorySale, Accessory)
        .join(Accessory, AccessorySale.accessory_id == Accessory.id)
        .order_by(AccessorySale.sold_at.desc())
        .limit(8)
        .all()
    )
    acc_list = [
        {
            "id": acc_sale.id,
            "type": "accessory",
            "model": f"{acc.name} x{acc_sale.quantity_sold}",
            "client_name": None,
            "sale_price_usd": float(acc_sale.sale_price_usd) * acc_sale.quantity_sold,
            "gross_profit_usd": float(acc_sale.gross_profit_usd),
            "sale_date": acc_sale.sold_at,
        }
        for acc_sale, acc in acc_results
    ]

    combined = sorted(iphone_list + acc_list, key=lambda x: x["sale_date"] or datetime.min, reverse=True)
    return combined[:8]


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
    return [{"model": row.model, "sales_count": row.sales_count, "total_sales_usd": float(row.total_sales_usd)} for row in results]


@router.get("/report")
def download_report(
    year: int = Query(...),
    month: int = Query(...),
    db: Session = Depends(get_db),
):
    month_start = datetime(year, month, 1)
    month_end = datetime(year + 1, 1, 1) if month == 12 else datetime(year, month + 1, 1)

    sales = (
        db.query(Sale, Product)
        .join(Product, Sale.product_id == Product.id)
        .filter(Sale.sale_date >= month_start, Sale.sale_date < month_end)
        .order_by(Sale.sale_date)
        .all()
    )
    acc_sales = (
        db.query(AccessorySale, Accessory)
        .join(Accessory, AccessorySale.accessory_id == Accessory.id)
        .filter(AccessorySale.sold_at >= month_start, AccessorySale.sold_at < month_end)
        .order_by(AccessorySale.sold_at)
        .all()
    )
    expenses = (
        db.query(Expense)
        .filter(
            extract("year", Expense.date) == year,
            extract("month", Expense.date) == month,
        )
        .order_by(Expense.date)
        .all()
    )
    active_debtors = db.query(Debtor).filter(Debtor.paid == False).order_by(Debtor.due_date.asc().nullslast()).all()

    output = io.StringIO()
    w = csv.writer(output)

    w.writerow([f"Resumen {MONTHS_ES_FULL[month]} {year}"])
    w.writerow([])

    w.writerow(["VENTAS iPhones"])
    w.writerow(["Fecha", "Modelo", "Cliente", "Precio USD", "Costo USD", "Ganancia bruta USD"])
    total_revenue = total_cost = total_profit = 0.0
    for sale, product in sales:
        rev = float(sale.sale_price_usd)
        cost = float(sale.purchase_price_usd_snapshot)
        profit = float(sale.gross_profit_usd)
        w.writerow([sale.sale_date.strftime("%d/%m/%Y") if sale.sale_date else "", product.model, sale.client_name or "", f"{rev:.2f}", f"{cost:.2f}", f"{profit:.2f}"])
        total_revenue += rev
        total_cost += cost
        total_profit += profit
    w.writerow(["TOTAL", "", "", f"{total_revenue:.2f}", f"{total_cost:.2f}", f"{total_profit:.2f}"])
    w.writerow([])

    w.writerow(["VENTAS Accesorios"])
    w.writerow(["Fecha", "Accesorio", "Cant.", "Precio USD", "Costo USD", "Ganancia bruta USD"])
    acc_revenue = acc_cost = acc_profit_total = 0.0
    for acc_sale, acc in acc_sales:
        rev = float(acc_sale.sale_price_usd) * acc_sale.quantity_sold
        cost = float(acc_sale.purchase_price_usd) * acc_sale.quantity_sold
        profit = float(acc_sale.gross_profit_usd)
        w.writerow([acc_sale.sold_at.strftime("%d/%m/%Y"), acc.name, acc_sale.quantity_sold, f"{rev:.2f}", f"{cost:.2f}", f"{profit:.2f}"])
        acc_revenue += rev
        acc_cost += cost
        acc_profit_total += profit
    w.writerow(["TOTAL", "", "", f"{acc_revenue:.2f}", f"{acc_cost:.2f}", f"{acc_profit_total:.2f}"])
    w.writerow([])

    w.writerow(["GASTOS"])
    w.writerow(["Fecha", "Categoria", "Descripcion", "ARS", "USD"])
    total_expenses_usd = 0.0
    for exp in expenses:
        usd = float(exp.amount_usd or 0)
        w.writerow([exp.date.strftime("%d/%m/%Y"), exp.category, exp.description or "", f"{float(exp.amount_ars):.2f}", f"{usd:.2f}"])
        total_expenses_usd += usd
    w.writerow(["TOTAL", "", "", "", f"{total_expenses_usd:.2f}"])
    w.writerow([])

    net = (total_profit + acc_profit_total) - total_expenses_usd
    w.writerow(["GANANCIA NETA (bruta - gastos USD)", f"{net:.2f}"])
    w.writerow([])

    w.writerow(["DEUDORES ACTIVOS"])
    w.writerow(["Nombre", "Monto USD", "Vencimiento", "Descripcion"])
    for d in active_debtors:
        w.writerow([d.name, f"{float(d.amount_usd):.2f}", d.due_date.strftime("%d/%m/%Y") if d.due_date else "", d.description or ""])
    w.writerow([])

    content = output.getvalue().encode("utf-8-sig")
    month_name = MONTHS_ES_FULL[month].lower()
    filename = f"resumen_{month_name}_{year}.csv"

    return Response(
        content=content,
        media_type="text/csv; charset=utf-8",
        headers={"Content-Disposition": f"attachment; filename={filename}"},
    )
