from urllib.request import Request, urlopen
from fastapi import APIRouter, HTTPException
import json

router = APIRouter(prefix="/exchange", tags=["Exchange"])


@router.get("/current")
def get_current_exchange():
    url = "https://dolarapi.com/v1/dolares/blue"

    try:
        request = Request(
            url,
            headers={"User-Agent": "Mozilla/5.0"},
        )

        with urlopen(request, timeout=15) as response:
            data = json.loads(response.read().decode("utf-8"))

        return {
            "source": "DolarAPI",
            "type": "Dólar Blue",
            "buy": data.get("compra"),
            "sell": data.get("venta"),
            "label": "Blue venta",
        }

    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Error obteniendo cotización: {str(e)}"
        )