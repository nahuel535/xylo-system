import httpx
from decimal import Decimal
from sqlalchemy.orm import Session

from app.models.exchange_rate_model import ExchangeRate

CORDOBA_OFFSET = Decimal("15")
DOLAR_API_URL = "https://dolarapi.com/v1/dolares/blue"


async def fetch_and_sync(db: Session) -> ExchangeRate:
    async with httpx.AsyncClient(timeout=10) as client:
        r = await client.get(DOLAR_API_URL)
        r.raise_for_status()
        data = r.json()

    buy = Decimal(str(data["compra"])) + CORDOBA_OFFSET
    sell = Decimal(str(data["venta"])) + CORDOBA_OFFSET

    rate = db.query(ExchangeRate).filter(ExchangeRate.is_active == True).first()
    if rate:
        rate.buy_rate_ars = buy
        rate.sell_rate_ars = sell
        rate.source_name = "Blue Córdoba (auto)"
        rate.manual_override = False
    else:
        db.query(ExchangeRate).update({ExchangeRate.is_active: False})
        rate = ExchangeRate(
            source_name="Blue Córdoba (auto)",
            buy_rate_ars=buy,
            sell_rate_ars=sell,
            is_active=True,
        )
        db.add(rate)

    db.commit()
    db.refresh(rate)
    return rate
