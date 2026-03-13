import os
import qrcode
from io import BytesIO

FRONTEND_URL = os.getenv("FRONTEND_URL")

def generate_qr(product_id):
    qr_url = f"{FRONTEND_URL}/scan/{product_id}"

    img = qrcode.make(qr_url)
    buffer = BytesIO()
    img.save(buffer, format="PNG")
    buffer.seek(0)

    return buffer