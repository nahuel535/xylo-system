from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from pydantic import BaseModel, EmailStr

from app.db.session import DemoSessionLocal, SessionLocal, get_db
from app.models.user import User
from app.core.security import verify_password, create_access_token, hash_password
from app.core.dependencies import get_current_user

router = APIRouter(prefix="/auth", tags=["Auth"])


class LoginRequest(BaseModel):
    email: EmailStr
    password: str


class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user_id: int
    user_name: str
    user_role: str
    must_change_password: bool
    is_demo: bool = False


class PasswordChangeRequest(BaseModel):
    current_password: str
    new_password: str


@router.post("/login", response_model=TokenResponse)
def login(data: LoginRequest, db: Session = Depends(get_db)):
    normalized_email = data.email.lower()
    user = db.query(User).filter(User.email == normalized_email).first()
    demo_db = None
    if not user:
        demo_db = DemoSessionLocal()
        user = demo_db.query(User).filter(User.email == normalized_email).first()

    try:
        if not user or not verify_password(data.password, user.password_hash):
            raise HTTPException(status_code=401, detail="Email o contraseña incorrectos")

        if not user.is_active:
            raise HTTPException(status_code=403, detail="Usuario inactivo")

        is_demo = bool(user.is_demo)
        token = create_access_token({
            "sub": str(user.id),
            "role": user.role,
            "demo": is_demo,
        })

        return TokenResponse(
            access_token=token,
            user_id=user.id,
            user_name=user.name,
            user_role=user.role,
            must_change_password=user.must_change_password,
            is_demo=is_demo,
        )
    finally:
        if demo_db is not None:
            demo_db.close()


@router.post("/change-password")
def change_password(
    data: PasswordChangeRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    if not verify_password(data.current_password, current_user.password_hash):
        raise HTTPException(status_code=400, detail="La contraseña actual es incorrecta")
    if len(data.new_password) < 8:
        raise HTTPException(status_code=400, detail="La nueva contraseña debe tener al menos 8 caracteres")
    if verify_password(data.new_password, current_user.password_hash):
        raise HTTPException(status_code=400, detail="La nueva contraseña debe ser diferente")

    new_password_hash = hash_password(data.new_password)
    demo_email = current_user.email if current_user.is_demo else None
    current_user.password_hash = new_password_hash
    current_user.must_change_password = False
    db.commit()

    if demo_email:
        public_db = SessionLocal()
        try:
            public_user = public_db.query(User).filter(User.email == demo_email).first()
            if public_user:
                public_user.password_hash = new_password_hash
                public_user.must_change_password = False
                public_db.commit()
        finally:
            public_db.close()
    return {"message": "Contraseña actualizada"}
