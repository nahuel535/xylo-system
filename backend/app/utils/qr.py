from io import BytesIO
import qrcode


def generate_product_qr(
    product_id: int,
    base_url: str = "https://xylo-system.vercel.app",
) -> BytesIO:
    qr_data = f"{base_url}/scan/{product_id}"

    qr = qrcode.make(qr_data)

    buffer = BytesIO()
    qr.save(buffer, format="PNG")
    buffer.seek(0)

    return buffer