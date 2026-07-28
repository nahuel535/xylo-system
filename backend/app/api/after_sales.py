from datetime import date, datetime, timedelta, timezone

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session

from app.core.dependencies import ensure_owner_or_admin, get_current_user, require_admin
from app.db.session import get_db
from app.models.accessory import Accessory
from app.models.audit_log import AuditLog
from app.models.product import Product
from app.models.sale import Sale
from app.models.service_claim import ServiceClaim
from app.models.user import User
from app.schemas.after_sales import ServiceClaimCreate, ServiceClaimUpdate


router = APIRouter(prefix="/after-sales", tags=["Posventa"])


@router.get("/overview")
def get_after_sales_overview(
    days: int = Query(30, ge=1, le=365),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    now = datetime.now(timezone.utc)
    reservation_query = db.query(Product).filter(
        Product.status == "reserved",
        Product.reserved_until.isnot(None),
    )
    if current_user.role != "admin":
        reservation_query = reservation_query.filter(Product.reserved_by == current_user.id)
    reservations = reservation_query.order_by(Product.reserved_until.asc()).all()

    sale_query = (
        db.query(Sale, Product)
        .join(Product, Sale.product_id == Product.id)
        .filter(Product.warranty_days.isnot(None), Product.warranty_days > 0)
    )
    if current_user.role != "admin":
        sale_query = sale_query.filter(Sale.seller_id == current_user.id)

    warranties = []
    for sale, product in sale_query.order_by(Sale.sale_date.desc()).all():
        warranty_end = sale.sale_date.date() + timedelta(days=product.warranty_days)
        remaining_days = (warranty_end - date.today()).days
        if -days <= remaining_days <= days:
            warranties.append({
                "sale_id": sale.id,
                "product_id": product.id,
                "model": product.model,
                "imei": product.imei,
                "client_name": sale.client_name,
                "seller_id": sale.seller_id,
                "warranty_days": product.warranty_days,
                "warranty_end": warranty_end,
                "remaining_days": remaining_days,
                "status": "expired" if remaining_days < 0 else "expiring",
            })

    claim_query = db.query(ServiceClaim)
    if current_user.role != "admin":
        claim_query = (
            claim_query
            .join(Sale, ServiceClaim.sale_id == Sale.id)
            .filter(Sale.seller_id == current_user.id)
        )
    open_claims_count = claim_query.filter(
        ServiceClaim.status.in_(["open", "in_review"])
    ).count()

    low_stock = []
    if current_user.role == "admin":
        low_stock = [
            {
                "id": accessory.id,
                "name": accessory.name,
                "category": accessory.category,
                "quantity": accessory.quantity,
                "min_stock": accessory.min_stock,
            }
            for accessory in db.query(Accessory).filter(
                Accessory.quantity <= Accessory.min_stock
            ).order_by(Accessory.quantity.asc()).all()
        ]

    return {
        "low_stock": low_stock,
        "overdue_reservations": [
            _reservation_payload(product)
            for product in reservations
            if _as_utc(product.reserved_until) < now
        ],
        "active_reservations": [
            _reservation_payload(product)
            for product in reservations
            if _as_utc(product.reserved_until) >= now
        ],
        "warranties": warranties,
        "open_claims_count": open_claims_count,
    }


@router.get("/claims")
def list_service_claims(
    status: str | None = Query(None),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    query = (
        db.query(ServiceClaim, Sale, Product, User)
        .join(Sale, ServiceClaim.sale_id == Sale.id)
        .join(Product, ServiceClaim.product_id == Product.id)
        .outerjoin(User, Sale.seller_id == User.id)
    )
    if current_user.role != "admin":
        query = query.filter(Sale.seller_id == current_user.id)
    if status:
        query = query.filter(ServiceClaim.status == status)
    return [
        _claim_payload(claim, sale, product, seller)
        for claim, sale, product, seller in query.order_by(ServiceClaim.received_at.desc()).all()
    ]


@router.post("/claims")
def create_service_claim(
    data: ServiceClaimCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    sale = db.query(Sale).filter(Sale.id == data.sale_id).first()
    if not sale:
        raise HTTPException(status_code=404, detail="Venta no encontrada")
    ensure_owner_or_admin(current_user, sale.seller_id)
    product = db.query(Product).filter(Product.id == sale.product_id).first()
    if not product:
        raise HTTPException(status_code=404, detail="Producto no encontrado")

    claim = ServiceClaim(
        sale_id=sale.id,
        product_id=product.id,
        created_by=current_user.id,
        client_name=sale.client_name,
        client_phone=data.client_phone,
        issue=data.issue.strip(),
    )
    db.add(claim)
    db.flush()
    db.add(AuditLog(
        entity_type="service_claim",
        entity_id=claim.id,
        user_id=current_user.id,
        action="created",
    ))
    db.commit()
    db.refresh(claim)
    return {"id": claim.id, "status": claim.status}


@router.patch("/claims/{claim_id}")
def update_service_claim(
    claim_id: int,
    data: ServiceClaimUpdate,
    db: Session = Depends(get_db),
    current_admin: User = Depends(require_admin),
):
    claim = db.query(ServiceClaim).filter(ServiceClaim.id == claim_id).first()
    if not claim:
        raise HTTPException(status_code=404, detail="Reclamo no encontrado")
    previous_status = claim.status
    claim.status = data.status
    claim.resolution = data.resolution
    claim.resolved_at = (
        datetime.now(timezone.utc)
        if data.status in {"resolved", "rejected"}
        else None
    )
    db.add(AuditLog(
        entity_type="service_claim",
        entity_id=claim.id,
        user_id=current_admin.id,
        action="updated",
        changes={
            "status": {"old": previous_status, "new": data.status},
            "resolution": {"new": data.resolution},
        },
    ))
    db.commit()
    db.refresh(claim)
    return {"id": claim.id, "status": claim.status}


def _reservation_payload(product: Product) -> dict:
    return {
        "product_id": product.id,
        "model": product.model,
        "storage": product.storage,
        "color": product.color,
        "imei": product.imei,
        "reserved_for": product.reserved_for,
        "reserved_until": product.reserved_until,
        "reserved_by": product.reserved_by,
        "reservation_notes": product.reservation_notes,
    }


def _claim_payload(
    claim: ServiceClaim,
    sale: Sale,
    product: Product,
    seller: User | None,
) -> dict:
    warranty_end = (
        sale.sale_date.date() + timedelta(days=product.warranty_days)
        if product.warranty_days
        else None
    )
    return {
        "id": claim.id,
        "sale_id": sale.id,
        "product_id": product.id,
        "model": product.model,
        "imei": product.imei,
        "client_name": claim.client_name,
        "client_phone": claim.client_phone,
        "seller_name": seller.name if seller else "Sin vendedor",
        "issue": claim.issue,
        "status": claim.status,
        "resolution": claim.resolution,
        "received_at": claim.received_at,
        "resolved_at": claim.resolved_at,
        "warranty_end": warranty_end,
        "under_warranty": bool(warranty_end and date.today() <= warranty_end),
    }


def _as_utc(value: datetime) -> datetime:
    return value if value.tzinfo else value.replace(tzinfo=timezone.utc)
