from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.core.dependencies import get_current_user, require_admin
from app.db.session import get_db
from app.models.system_setting import SystemSetting
from app.models.user import User
from app.schemas.system_setting import (
    BaseCommissionResponse,
    BaseCommissionUpdate,
    CardInstallmentRatesResponse,
    CardInstallmentRatesUpdate,
)
from app.services.settings import (
    BASE_SELLER_COMMISSION_KEY,
    CARD_INSTALLMENT_RATES_KEY,
    get_base_seller_commission,
    get_card_installment_rates,
    set_setting,
)

router = APIRouter(prefix="/settings", tags=["Settings"])


@router.get("/base-seller-commission", response_model=BaseCommissionResponse)
def get_base_commission(
    db: Session = Depends(get_db),
    _: User = Depends(get_current_user),
):
    amount = get_base_seller_commission(db)
    setting = db.query(SystemSetting).filter(SystemSetting.key == BASE_SELLER_COMMISSION_KEY).first()
    return BaseCommissionResponse(amount_usd=amount, updated_at=setting.updated_at if setting else None)


@router.put("/base-seller-commission", response_model=BaseCommissionResponse)
def update_base_commission(
    data: BaseCommissionUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_admin),
):
    setting = set_setting(db, BASE_SELLER_COMMISSION_KEY, str(data.amount_usd), updated_by=current_user.id)
    return BaseCommissionResponse(amount_usd=data.amount_usd, updated_at=setting.updated_at)


@router.get("/card-installment-rates", response_model=CardInstallmentRatesResponse)
def get_installment_rates(
    db: Session = Depends(get_db),
    _: User = Depends(get_current_user),
):
    rates = get_card_installment_rates(db)
    setting = db.query(SystemSetting).filter(SystemSetting.key == CARD_INSTALLMENT_RATES_KEY).first()
    return CardInstallmentRatesResponse(rates=rates, updated_at=setting.updated_at if setting else None)


@router.put("/card-installment-rates", response_model=CardInstallmentRatesResponse)
def update_installment_rates(
    data: CardInstallmentRatesUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_admin),
):
    import json
    setting = set_setting(db, CARD_INSTALLMENT_RATES_KEY, json.dumps(data.rates), updated_by=current_user.id)
    return CardInstallmentRatesResponse(rates=data.rates, updated_at=setting.updated_at)
