from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.db.session import engine, Base
from app.db.base import User, Product, Sale, SalePayment
from app.api.users import router as users_router
from app.api.products import router as products_router
from app.api.sales import router as sales_router
from app.api.dashboard import router as dashboard_router
from app.api.exchange_rate import router as exchange_rates_router

Base.metadata.create_all(bind=engine)

app = FastAPI(title="Xylo API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",
        "http://127.0.0.1:5173",
        "https://xylo-system.vercel.app",
    ],
    allow_origin_regex=r"https://.*\.vercel\.app",
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(users_router)
app.include_router(products_router)
app.include_router(sales_router)
app.include_router(dashboard_router)
app.include_router(exchange_rates_router)

@app.get("/")
def read_root():
    return {"message": "Xylo backend funcionando con PostgreSQL"}