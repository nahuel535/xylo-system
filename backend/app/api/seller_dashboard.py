from datetime import date, datetime, timedelta

from fastapi import APIRouter, Depends
from sqlalchemy import func
from sqlalchemy.orm import Session, joinedload

from app.core.dependencies import get_current_user
from app.db.session import get_db
from app.models.appointment import Appointment
from app.models.client import Client, ClientReminder
from app.models.product import Product
from app.models.quote import Quote
from app.models.sale import Sale
from app.models.user import User


router = APIRouter(prefix="/seller-dashboard", tags=["Seller Dashboard"])


@router.get("/summary")
def get_seller_dashboard(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    today = date.today()
    now = datetime.now()
    month_start = datetime(now.year, now.month, 1)
    month_end = datetime(now.year + 1, 1, 1) if now.month == 12 else datetime(now.year, now.month + 1, 1)
    last_month_start = (
        datetime(now.year - 1, 12, 1)
        if now.month == 1
        else datetime(now.year, now.month - 1, 1)
    )

    sales_query = db.query(Sale).filter(
        Sale.seller_id == current_user.id,
        Sale.is_returned == False,
    )
    month_sales = sales_query.filter(
        Sale.sale_date >= month_start,
        Sale.sale_date < month_end,
    )
    month_sales_count = month_sales.count()
    month_sales_value = month_sales.with_entities(
        func.coalesce(func.sum(Sale.sale_price_usd), 0)
    ).scalar()
    today_sales_count = sales_query.filter(func.date(Sale.sale_date) == today).count()
    last_month_sales_count = sales_query.filter(
        Sale.sale_date >= last_month_start,
        Sale.sale_date < month_start,
    ).count()

    active_clients = db.query(Client).filter(
        Client.owner_user_id == current_user.id,
        Client.status != "inactive",
    ).count()
    due_followups = (
        db.query(ClientReminder)
        .join(Client, ClientReminder.client_id == Client.id)
        .filter(
            Client.owner_user_id == current_user.id,
            ClientReminder.status == "pending",
            ClientReminder.due_date <= today,
        )
        .count()
    )

    upcoming_appointments = (
        db.query(Appointment)
        .options(joinedload(Appointment.client))
        .filter(
            Appointment.created_by == current_user.id,
            Appointment.date >= today,
            Appointment.date <= today + timedelta(days=7),
            Appointment.status.in_(["pending", "confirmed"]),
        )
        .order_by(Appointment.date.asc(), Appointment.start_time.asc())
        .limit(6)
        .all()
    )
    open_quotes = db.query(Quote).filter(
        Quote.created_by == current_user.id,
        Quote.status.in_(["draft", "sent"]),
    ).count()
    accepted_quotes = db.query(Quote).filter(
        Quote.created_by == current_user.id,
        Quote.status == "accepted",
        Quote.updated_at >= month_start,
        Quote.updated_at < month_end,
    ).count()

    recent_sales = (
        db.query(Sale, Product)
        .join(Product, Sale.product_id == Product.id)
        .filter(Sale.seller_id == current_user.id)
        .order_by(Sale.sale_date.desc())
        .limit(6)
        .all()
    )

    return {
        "seller_name": current_user.name,
        "sales_this_month_count": month_sales_count,
        "sales_this_month_value_usd": float(month_sales_value or 0),
        "sales_today_count": today_sales_count,
        "sales_last_month_count": last_month_sales_count,
        "active_clients_count": active_clients,
        "due_followups_count": due_followups,
        "open_quotes_count": open_quotes,
        "accepted_quotes_this_month_count": accepted_quotes,
        "upcoming_appointments": [
            {
                "id": appointment.id,
                "title": appointment.title,
                "date": appointment.date,
                "start_time": appointment.start_time,
                "status": appointment.status,
                "client_id": appointment.client_id,
                "client_name": (
                    appointment.client.name
                    if appointment.client
                    else appointment.contact_name
                ),
                "client_phone": (
                    appointment.client.phone
                    if appointment.client
                    else appointment.contact_phone
                ),
            }
            for appointment in upcoming_appointments
        ],
        "recent_sales": [
            {
                "id": sale.id,
                "model": product.model,
                "client_name": sale.client_name,
                "sale_price_usd": float(sale.sale_price_usd),
                "sale_date": sale.sale_date,
            }
            for sale, product in recent_sales
        ],
    }
