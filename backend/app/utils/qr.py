import os
import qrcode
from io import BytesIO

FRONTEND_URL = os.getenv("FRONTEND_URL", "").rstrip("/")

def generate_product_qr(product_id):
    if not FRONTEND_URL:
        raise ValueError("FRONTEND_URL no está configurada")

    qr_url = f"{FRONTEND_URL}/scan/{product_id}"

    img = qrcode.make(qr_url)
    buffer = BytesIO()
    img.save(buffer, format="PNG")
    buffer.seek(0)

    return buffer

# Alias por compatibilidad
generate_qr = generate_product_qr