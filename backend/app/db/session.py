import os
from dotenv import load_dotenv
from fastapi import Request
from sqlalchemy import create_engine
from sqlalchemy.orm import declarative_base, sessionmaker

from app.core.security import decode_token

load_dotenv()

DATABASE_URL = os.getenv("DATABASE_URL")

engine = create_engine(DATABASE_URL)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
DEMO_SCHEMA = "demo_nahuel"

if DATABASE_URL and DATABASE_URL.startswith(("postgresql://", "postgres://")):
    demo_engine = create_engine(
        DATABASE_URL,
        connect_args={"options": f"-csearch_path={DEMO_SCHEMA},public"},
    )
    DemoSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=demo_engine)
else:
    demo_engine = engine
    DemoSessionLocal = SessionLocal

Base = declarative_base()


def get_db(request: Request):
    session_factory = SessionLocal
    auth = request.headers.get("Authorization", "")
    if auth.startswith("Bearer "):
        payload = decode_token(auth.split(" ", 1)[1])
        if payload and payload.get("demo") is True:
            session_factory = DemoSessionLocal

    db = session_factory()
    try:
        yield db
    finally:
        db.close()
