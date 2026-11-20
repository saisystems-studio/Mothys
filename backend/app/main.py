
import os

from dotenv import load_dotenv

load_dotenv()

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy import text
from sqlalchemy.exc import SQLAlchemyError

from app.core.database import engine

from app.api.roles import router as roles_router
from app.api.users import router as users_router
from app.api.units import router as units_router
from app.api.products import router as products_router
from app.api.vouchers import router as vouchers_router
from app.api.stock import router as stock_router
from app.api.dashboard import router as dashboard_router
from app.api.reports import router as reports_router
from app.api.auth import router as auth_router
from app.api.company_profile import router as company_profile_router

APP_ENV = os.getenv("APP_ENV", "development").lower()

frontend_origins = os.getenv(
    "FRONTEND_ORIGINS",
    "http://localhost:5173,http://localhost:5174"
)

allowed_origins = [
    origin.strip()
    for origin in frontend_origins.split(",")
    if origin.strip()
]

app = FastAPI(
    title="Mothys API",
    description="Inventory Management System",
    version="1.0.0",
    docs_url="/docs" if APP_ENV != "production" else None,
    redoc_url="/redoc" if APP_ENV != "production" else None,
    openapi_url="/openapi.json" if APP_ENV != "production" else None
)


app.add_middleware(
    CORSMiddleware,
    allow_origins=allowed_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"]
)


app.include_router(roles_router)
app.include_router(users_router)
app.include_router(units_router)
app.include_router(products_router)
app.include_router(vouchers_router)
app.include_router(stock_router)
app.include_router(dashboard_router)
app.include_router(reports_router)
app.include_router(auth_router)
app.include_router(company_profile_router)

@app.get("/")
def home():
    return {
        "message": "Welcome to Mothys API",
        "status": "running"
    }


@app.get("/health")
def health_check():
    try:
        with engine.connect() as connection:
            connection.execute(text("SELECT 1"))

        return {
            "status": "healthy",
            "database": "connected"
        }

    except SQLAlchemyError:
        raise HTTPException(
            status_code=503,
            detail={
                "status": "unhealthy",
                "database": "disconnected"
            }
        )
