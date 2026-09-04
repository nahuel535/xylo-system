from decimal import Decimal
from typing import Optional

from sqlalchemy.orm import Session

from app.models.system_setting import SystemSetting

BASE_SELLER_COMMISSION_KEY = "base_seller_commission_usd"
DEFAULT_BASE_SELLER_COMMISSION_USD = Decimal("10.00")


def get_setting(db: Session, key: str) -> Optional[str]:
    setting = db.query(SystemSetting).filter(SystemSetting.key == key).first()
    return setting.value if setting else None


def set_setting(db: Session, key: str, value: str, updated_by: Optional[int] = None) -> SystemSetting:
    setting = db.query(SystemSetting).filter(SystemSetting.key == key).first()
    if setting:
        setting.value = value
        setting.updated_by = updated_by
    else:
        setting = SystemSetting(key=key, value=value, updated_by=updated_by)
        db.add(setting)
    db.commit()
    db.refresh(setting)
    return setting


def get_base_seller_commission(db: Session) -> Decimal:
    """Comisión base por venta cuando no se especifica una puntual.
    Configurable desde /settings/base-seller-commission; si nunca se cargó, usa el default histórico."""
    raw_value = get_setting(db, BASE_SELLER_COMMISSION_KEY)
    if raw_value is None:
        return DEFAULT_BASE_SELLER_COMMISSION_USD
    try:
        return Decimal(raw_value)
    except Exception:
        return DEFAULT_BASE_SELLER_COMMISSION_USD
