from decimal import Decimal
from typing import Optional
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from sqlalchemy import func as sqlfunc

from app.db.session import get_db
from app.models.user import User
from app.models.sale import Sale
from app.schemas.user import UserCreate, UserResponse, CommissionRateUpdate, SellerCommissionSummary
from app.core.security import hash_password
from app.core.dependencies import require_admin, get_current_user

router = APIRouter(prefix="/users", tags=["Users"])


@router.post("/", response_model=UserResponse)
def create_user(
    user_data: UserCreate,
    db: Session = Depends(get_db),
    _: User = Depends(require_admin),
):
    existing_user = db.query(User).filter(User.email == user_data.email).first()
    if existing_user:
        raise HTTPException(status_code=400, detail="El email ya está registrado")

    new_user = User(
        name=user_data.name,
        email=user_data.email,
        password_hash=hash_password(user_data.password),
        role=user_data.role,
    )
    db.add(new_user)
    db.commit()
    db.refresh(new_user)
    return new_user


@router.get("/", response_model=list[UserResponse])
def list_users(
    db: Session = Depends(get_db),
    _: User = Depends(get_current_user),
):
    return db.query(User).order_by(User.id.desc()).all()


@router.patch("/{user_id}/commission-rate", response_model=UserResponse)
def update_commission_rate(
    user_id: int,
    data: CommissionRateUpdate,
    db: Session = Depends(get_db),
    _: User = Depends(require_admin),
):
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="Usuario no encontrado")
    user.commission_rate = data.commission_rate
    db.commit()
    db.refresh(user)
    return user


@router.get("/commissions/summary", response_model=list[SellerCommissionSummary])
def get_commissions_summary(
    month: Optional[int] = Query(None),
    year: Optional[int] = Query(None),
    db: Session = Depends(get_db),
    _: User = Depends(get_current_user),
):
    sellers = db.query(User).filter(User.is_active == True).all()
    result = []

    for seller in sellers:
        q = db.query(Sale).filter(
            Sale.seller_id == seller.id,
            Sale.is_returned == False,
        )
        if month and year:
            from sqlalchemy import extract
            q = q.filter(
                extract("month", Sale.sale_date) == month,
                extract("year", Sale.sale_date) == year,
            )
        sales = q.all()

        total_sales = sum(Decimal(str(s.sale_price_usd)) for s in sales)
        total_profit = sum(Decimal(str(s.gross_profit_usd)) for s in sales)
        total_commission = sum(
            Decimal(str(s.commission_usd)) for s in sales if s.commission_usd is not None
        )

        result.append(SellerCommissionSummary(
            seller_id=seller.id,
            seller_name=seller.name,
            commission_rate=Decimal(str(seller.commission_rate)),
            sales_count=len(sales),
            total_sales_usd=total_sales,
            total_gross_profit_usd=total_profit,
            total_commission_usd=total_commission,
        ))

    return sorted(result, key=lambda x: x.total_commission_usd, reverse=True)
