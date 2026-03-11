from fastapi.responses import FileResponse
from app.utils.qr import generate_product_qr

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.db.session import get_db
from app.models.product import Product
from app.schemas.product import ProductCreate, ProductResponse, ProductUpdate
from app.models.user import User


router = APIRouter(prefix="/products", tags=["Products"])


@router.post("/", response_model=ProductResponse)
def create_product(product_data: ProductCreate, db: Session = Depends(get_db)):
    existing_product = db.query(Product).filter(Product.imei == product_data.imei).first()
    if existing_product:
        raise HTTPException(status_code=400, detail="Ya existe un producto con ese IMEI")

    new_product = Product(**product_data.model_dump())

    db.add(new_product)
    db.commit()
    db.refresh(new_product)
    return new_product


@router.get("/", response_model=list[ProductResponse])
def list_products(db: Session = Depends(get_db)):
    return db.query(Product).order_by(Product.id.desc()).all()


@router.get("/{product_id}", response_model=ProductResponse)
def get_product(product_id: int, db: Session = Depends(get_db)):
    product = db.query(Product).filter(Product.id == product_id).first()
    if not product:
        raise HTTPException(status_code=404, detail="Producto no encontrado")
    return product

@router.put("/{product_id}", response_model=ProductResponse)
def update_product(product_id: int, product_data: ProductUpdate, db: Session = Depends(get_db)):
    product = db.query(Product).filter(Product.id == product_id).first()

    if not product:
        raise HTTPException(status_code=404, detail="Producto no encontrado")

    if product_data.created_by is not None:
        user_exists = db.query(User).filter(User.id == product_data.created_by).first()
        if not user_exists:
            raise HTTPException(status_code=400, detail="El usuario created_by no existe")

    for key, value in product_data.model_dump().items():
        setattr(product, key, value)

    db.commit()
    db.refresh(product)

    return product

@router.delete("/{product_id}")
def delete_product(product_id: int, db: Session = Depends(get_db)):

    product = db.query(Product).filter(Product.id == product_id).first()

    if not product:
        raise HTTPException(status_code=404, detail="Producto no encontrado")

    db.delete(product)
    db.commit()

    return {"message": "Producto eliminado correctamente"}

@router.get("/{product_id}/qr")
def get_product_qr(product_id: int, db: Session = Depends(get_db)):
    product = db.query(Product).filter(Product.id == product_id).first()

    if not product:
        raise HTTPException(status_code=404, detail="Producto no encontrado")

    file_path = generate_product_qr(product.id)

    product.qr_code_url = file_path
    db.commit()
    db.refresh(product)

    return FileResponse(file_path, media_type="image/png", filename=f"product_{product.id}_qr.png")