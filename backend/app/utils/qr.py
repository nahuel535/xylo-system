import os
import qrcode

def generate_product_qr(product_id: int, base_url: str = "https://xylo-system.vercel.app") -> str:
    qr_data = f"{base_url}/scan/{product_id}"

    folder_path = "qrcodes"
    os.makedirs(folder_path, exist_ok=True)

    file_name = f"product_{product_id}.png"
    file_path = os.path.join(folder_path, file_name)

    qr = qrcode.make(qr_data)
    qr.save(file_path)

    return file_path