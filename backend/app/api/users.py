from decimal import Decimal
from typing import Optional
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from sqlalchemy import func as sqlfunc

from app.db.session import get_db
from app.models.user import User
from app.models.sale import Sale
from app.schemas.user import (
    AdminPasswordReset,
    CommissionRateUpdate,
    SellerCommissionSummary,
    UserCreate,
    UserResponse,
    UserStatusUpdate,
    UserUpdate,
)
from app.core.security import hash_password
from app.core.dependencies import require_admin

router = APIRouter(prefix="/users", tags=["Users"])


@router.post("/", response_model=UserResponse)
def create_user(
    user_data: UserCreate,
    db: Session = Depends(get_db),
    _: User = Depends(require_admin),
):
    normalized_email = user_data.email.lower()
    existing_user = db.query(User).filter(sqlfunc.lower(User.email) == normalized_email).first()
    if existing_user:
        raise HTTPException(status_code=400, detail="El email ya está registrado")

    new_user = User(
        name=user_data.name,
        email=normalized_email,
        password_hash=hash_password(user_data.password),
        role=user_data.role,
        must_change_password=user_data.role == "seller",
        commission_rate=user_data.commission_rate,
    )
    db.add(new_user)
    db.commit()
    db.refresh(new_user)
    return new_user


@router.get("/", response_model=list[UserResponse])
def list_users(
    db: Session = Depends(get_db),
    _: User = Depends(require_admin),
):
    return db.query(User).order_by(User.id.desc()).all()


def _get_user_or_404(user_id: int, db: Session) -> User:
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="Usuario no encontrado")
    return user


def _ensure_another_active_admin(user: User, db: Session) -> None:
    if user.role != "admin" or not user.is_active:
        return
    other_admin_exists = db.query(User.id).filter(
        User.role == "admin",
        User.is_active == True,
        User.id != user.id,
    ).first()
    if not other_admin_exists:
        raise HTTPException(
            status_code=400,
            detail="Debe quedar al menos otro administrador activo",
        )


@router.patch("/{user_id}", response_model=UserResponse)
def update_user(
    user_id: int,
    data: UserUpdate,
    db: Session = Depends(get_db),
    current_admin: User = Depends(require_admin),
):
    user = _get_user_or_404(user_id, db)
    changes = data.model_dump(exclude_unset=True)

    if "email" in changes:
        normalized_email = str(changes["email"]).lower()
        duplicate = db.query(User).filter(
            sqlfunc.lower(User.email) == normalized_email,
            User.id != user.id,
        ).first()
        if duplicate:
            raise HTTPException(status_code=400, detail="El email ya está registrado")
        changes["email"] = normalized_email

    if changes.get("role") and changes["role"] != user.role:
        if user.id == current_admin.id:
            raise HTTPException(status_code=400, detail="No podés cambiar tu propio rol")
        if changes["role"] != "admin":
            _ensure_another_active_admin(user, db)
        user.must_change_password = changes["role"] == "seller"

    for field, value in changes.items():
        setattr(user, field, value)

    db.commit()
    db.refresh(user)
    return user


@router.patch("/{user_id}/status", response_model=UserResponse)
def update_user_status(
    user_id: int,
    data: UserStatusUpdate,
    db: Session = Depends(get_db),
    current_admin: User = Depends(require_admin),
):
    user = _get_user_or_404(user_id, db)
    if user.id == current_admin.id and not data.is_active:
        raise HTTPException(status_code=400, detail="No podés desactivar tu propia cuenta")
    if not data.is_active:
        _ensure_another_active_admin(user, db)

    user.is_active = data.is_active
    db.commit()
    db.refresh(user)
    return user


@router.post("/{user_id}/reset-password")
def reset_user_password(
    user_id: int,
    data: AdminPasswordReset,
    db: Session = Depends(get_db),
    _: User = Depends(require_admin),
):
    user = _get_user_or_404(user_id, db)
    user.password_hash = hash_password(data.new_password)
    user.must_change_password = True
    db.commit()
    return {"message": "Contraseña restablecida. El usuario deberá cambiarla al ingresar."}


@router.patch("/{user_id}/commission-rate", response_model=UserResponse)
def update_commission_rate(
    user_id: int,
    data: CommissionRateUpdate,
    db: Session = Depends(get_db),
    _: User = Depends(require_admin),
):
    user = _get_user_or_404(user_id, db)
    user.commission_rate = data.commission_rate
    db.commit()
    db.refresh(user)
    return user


@router.get("/commissions/summary", response_model=list[SellerCommissionSummary])
def get_commissions_summary(
    month: Optional[int] = Query(None),
    year: Optional[int] = Query(None),
    db: Session = Depends(get_db),
    _: User = Depends(require_admin),
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
