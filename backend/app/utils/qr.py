from fastapi.responses import StreamingResponse
from app.utils.qr import generate_product_qr

@router.get("/{product_id}/qr")
def get_product_qr(product_id: int, db: Session = Depends(get_db)):
    product = db.query(Product).filter(Product.id == product_id).first()
    if not product:
        raise HTTPException(status_code=404, detail="Producto no encontrado")

    buffer = generate_product_qr(product.id)

    return StreamingResponse(
        buffer,
        media_type="image/png",
        headers={"Content-Disposition": f"attachment; filename=product_{product.id}_qr.png"}
    )