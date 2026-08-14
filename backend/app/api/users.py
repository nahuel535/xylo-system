from decimal import Decimal
from typing import Optional
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from sqlalchemy import func as sqlfunc

from app.db.session import get_db
from app.models.user import User
from app.models.sale import Sale
from app.models.seller_payout import SellerPayout
from app.schemas.user import (
    AdminPasswordReset,
    CommissionRateUpdate,
    SellerCommissionSummary,
    SellerPayoutCreate,
    SellerPayoutResponse,
    SellerPayoutUpdate,
    UserCreate,
    UserResponse,
    UserStatusUpdate,
    UserUpdate,
)
from app.core.security import hash_password
from app.core.dependencies import require_admin
from app.services.audit import record_audit

router = APIRouter(prefix="/users", tags=["Users"])


@router.post("/", response_model=UserResponse)
def create_user(
    user_data: UserCreate,
    db: Session = Depends(get_db),
    current_admin: User = Depends(require_admin),
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
        is_demo=current_admin.is_demo,
        commission_rate=user_data.commission_rate,
    )
    db.add(new_user)
    db.flush()
    record_audit(
        db,
        entity_type="user",
        entity_id=new_user.id,
        user=current_admin,
        action="created",
    )
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

    if changes:
        record_audit(
            db,
            entity_type="user",
            entity_id=user.id,
            user=current_admin,
            action="updated",
            changes={
                field: {"new": value}
                for field, value in changes.items()
            },
        )
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
    record_audit(
        db,
        entity_type="user",
        entity_id=user.id,
        user=current_admin,
        action="activated" if data.is_active else "deactivated",
    )
    db.commit()
    db.refresh(user)
    return user


@router.post("/{user_id}/reset-password")
def reset_user_password(
    user_id: int,
    data: AdminPasswordReset,
    db: Session = Depends(get_db),
    current_admin: User = Depends(require_admin),
):
    user = _get_user_or_404(user_id, db)
    user.password_hash = hash_password(data.new_password)
    user.must_change_password = True
    record_audit(
        db,
        entity_type="user",
        entity_id=user.id,
        user=current_admin,
        action="password_reset",
    )
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
    sellers = db.query(User).filter(
        User.is_active == True,
        User.role == "seller",
    ).all()
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
        paid_query = db.query(
            sqlfunc.coalesce(sqlfunc.sum(SellerPayout.amount_usd), 0)
        ).filter(SellerPayout.seller_id == seller.id)
        if month and year:
            from sqlalchemy import extract
            paid_query = paid_query.filter(
                extract("month", SellerPayout.paid_at) == month,
                extract("year", SellerPayout.paid_at) == year,
            )
        paid_this_month = Decimal(str(paid_query.scalar() or 0))

        all_time_commission = Decimal(str(
            db.query(sqlfunc.coalesce(sqlfunc.sum(Sale.commission_usd), 0)).filter(
                Sale.seller_id == seller.id,
                Sale.is_returned == False,
            ).scalar() or 0
        ))
        all_time_paid = Decimal(str(
            db.query(sqlfunc.coalesce(sqlfunc.sum(SellerPayout.amount_usd), 0)).filter(
                SellerPayout.seller_id == seller.id,
            ).scalar() or 0
        ))

        result.append(SellerCommissionSummary(
            seller_id=seller.id,
            seller_name=seller.name,
            commission_rate=Decimal(str(seller.commission_rate)),
            sales_count=len(sales),
            total_sales_usd=total_sales,
            total_gross_profit_usd=total_profit,
            total_commission_usd=total_commission,
            paid_this_month_usd=paid_this_month,
            pending_commission_usd=all_time_commission - all_time_paid,
        ))

    return sorted(result, key=lambda x: x.total_commission_usd, reverse=True)


def _seller_pending_commission(seller_id: int, db: Session) -> Decimal:
    accrued = Decimal(str(
        db.query(sqlfunc.coalesce(sqlfunc.sum(Sale.commission_usd), 0)).filter(
            Sale.seller_id == seller_id,
            Sale.is_returned == False,
        ).scalar() or 0
    ))
    paid = Decimal(str(
        db.query(sqlfunc.coalesce(sqlfunc.sum(SellerPayout.amount_usd), 0)).filter(
            SellerPayout.seller_id == seller_id,
        ).scalar() or 0
    ))
    return accrued - paid


def _get_seller_or_404(seller_id: int, db: Session) -> User:
    seller = db.query(User).filter(
        User.id == seller_id,
        User.role == "seller",
    ).first()
    if not seller:
        raise HTTPException(status_code=404, detail="Vendedor no encontrado")
    return seller


def _payout_response(payout: SellerPayout, users_by_id: dict[int, User]) -> dict:
    seller = users_by_id.get(payout.seller_id)
    creator = users_by_id.get(payout.created_by) if payout.created_by else None
    return {
        "id": payout.id,
        "seller_id": payout.seller_id,
        "seller_name": seller.name if seller else "Vendedor",
        "amount_usd": payout.amount_usd,
        "paid_at": payout.paid_at,
        "notes": payout.notes,
        "created_by": payout.created_by,
        "created_by_name": creator.name if creator else None,
        "created_at": payout.created_at,
    }


@router.get("/commissions/payments", response_model=list[SellerPayoutResponse])
def list_seller_payouts(
    month: Optional[int] = Query(None, ge=1, le=12),
    year: Optional[int] = Query(None, ge=2000, le=2100),
    seller_id: Optional[int] = Query(None),
    db: Session = Depends(get_db),
    _: User = Depends(require_admin),
):
    query = db.query(SellerPayout)
    if month is not None:
        from sqlalchemy import extract
        query = query.filter(extract("month", SellerPayout.paid_at) == month)
    if year is not None:
        from sqlalchemy import extract
        query = query.filter(extract("year", SellerPayout.paid_at) == year)
    if seller_id is not None:
        query = query.filter(SellerPayout.seller_id == seller_id)

    payouts = query.order_by(SellerPayout.paid_at.desc(), SellerPayout.id.desc()).all()
    user_ids = {p.seller_id for p in payouts} | {p.created_by for p in payouts if p.created_by}
    users_by_id = {
        user.id: user
        for user in db.query(User).filter(User.id.in_(user_ids)).all()
    } if user_ids else {}
    return [_payout_response(payout, users_by_id) for payout in payouts]


@router.post("/commissions/payments", response_model=SellerPayoutResponse)
def create_seller_payout(
    data: SellerPayoutCreate,
    db: Session = Depends(get_db),
    current_admin: User = Depends(require_admin),
):
    seller = _get_seller_or_404(data.seller_id, db)
    amount = Decimal(str(data.amount_usd)).quantize(Decimal("0.01"))
    pending = _seller_pending_commission(seller.id, db)
    if amount > pending:
        raise HTTPException(
            status_code=400,
            detail=f"El pago supera el saldo pendiente de USD {pending:.2f}",
        )

    payout = SellerPayout(
        seller_id=seller.id,
        amount_usd=amount,
        paid_at=data.paid_at,
        notes=data.notes.strip() if data.notes and data.notes.strip() else None,
        created_by=current_admin.id,
    )
    db.add(payout)
    db.flush()
    record_audit(
        db,
        entity_type="seller_payout",
        entity_id=payout.id,
        user=current_admin,
        action="created",
        changes={"seller_id": seller.id, "amount_usd": str(amount), "paid_at": str(data.paid_at)},
    )
    db.commit()
    db.refresh(payout)
    return _payout_response(payout, {seller.id: seller, current_admin.id: current_admin})


@router.put("/commissions/payments/{payout_id}", response_model=SellerPayoutResponse)
def update_seller_payout(
    payout_id: int,
    data: SellerPayoutUpdate,
    db: Session = Depends(get_db),
    current_admin: User = Depends(require_admin),
):
    payout = db.query(SellerPayout).filter(SellerPayout.id == payout_id).first()
    if not payout:
        raise HTTPException(status_code=404, detail="Pago no encontrado")
    seller = _get_seller_or_404(payout.seller_id, db)
    changes = data.model_dump(exclude_unset=True)

    if "amount_usd" in changes:
        amount = Decimal(str(changes["amount_usd"])).quantize(Decimal("0.01"))
        available = _seller_pending_commission(seller.id, db) + Decimal(str(payout.amount_usd))
        if amount > available:
            raise HTTPException(
                status_code=400,
                detail=f"El pago supera el saldo disponible de USD {available:.2f}",
            )
        payout.amount_usd = amount
    if "paid_at" in changes:
        payout.paid_at = changes["paid_at"]
    if "notes" in changes:
        notes = changes["notes"]
        payout.notes = notes.strip() if notes and notes.strip() else None

    record_audit(
        db,
        entity_type="seller_payout",
        entity_id=payout.id,
        user=current_admin,
        action="updated",
        changes={key: {"new": str(value) if value is not None else None} for key, value in changes.items()},
    )
    db.commit()
    db.refresh(payout)
    users_by_id = {seller.id: seller, current_admin.id: current_admin}
    return _payout_response(payout, users_by_id)


@router.delete("/commissions/payments/{payout_id}")
def delete_seller_payout(
    payout_id: int,
    db: Session = Depends(get_db),
    current_admin: User = Depends(require_admin),
):
    payout = db.query(SellerPayout).filter(SellerPayout.id == payout_id).first()
    if not payout:
        raise HTTPException(status_code=404, detail="Pago no encontrado")
    record_audit(
        db,
        entity_type="seller_payout",
        entity_id=payout.id,
        user=current_admin,
        action="deleted",
        changes={
            "seller_id": payout.seller_id,
            "amount_usd": str(payout.amount_usd),
            "paid_at": str(payout.paid_at),
        },
    )
    db.delete(payout)
    db.commit()
    return {"ok": True}
