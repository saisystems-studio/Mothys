
import os
import jwt

from datetime import datetime, timedelta, timezone
from pwdlib import PasswordHash
from dotenv import load_dotenv

from fastapi import Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.models.users import User


load_dotenv()

password_hash = PasswordHash.recommended()

SECRET_KEY = os.getenv("JWT_SECRET_KEY")

if not SECRET_KEY or len(SECRET_KEY) < 32:
    raise RuntimeError(
        "JWT_SECRET_KEY must contain at least 32 characters"
    )

ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 60

oauth2_scheme = OAuth2PasswordBearer(
    tokenUrl="/auth/login"
)


def hash_password(password: str) -> str:
    return password_hash.hash(password)


def verify_password(plain_password: str, hashed_password: str) -> bool:
    return password_hash.verify(plain_password, hashed_password)


def create_access_token(data: dict) -> str:
    to_encode = data.copy()

    expire = datetime.now(timezone.utc) + timedelta(
        minutes=ACCESS_TOKEN_EXPIRE_MINUTES
    )

    to_encode.update({"exp": expire})

    return jwt.encode(
        to_encode,
        SECRET_KEY,
        algorithm=ALGORITHM
    )


def decode_access_token(token: str) -> dict:
    return jwt.decode(
        token,
        SECRET_KEY,
        algorithms=[ALGORITHM]
    )


def get_current_user(
    token: str = Depends(oauth2_scheme),
    db: Session = Depends(get_db)
):
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Invalid or expired authentication token",
        headers={"WWW-Authenticate": "Bearer"},
    )

    try:
        payload = decode_access_token(token)
        user_id = payload.get("sub")

        if user_id is None:
            raise credentials_exception

        user_id = int(user_id)

    except (jwt.InvalidTokenError, ValueError, TypeError):
        raise credentials_exception

    user = db.query(User).filter(
        User.id == user_id,
        User.is_active == True
    ).first()

    if user is None:
        raise credentials_exception

    return user


def is_registered_admin(user: User) -> bool:
    return (
        user.auth_provider == "NEXUS"
        or user.role_id == 1
    )


def get_user_permissions(user: User) -> dict:
    import json

    if is_registered_admin(user):
        return {
            "dashboard": True,
            "products": True,
            "units": True,
            "products_in": True,
            "billing": True,
            "stock": True,
            "reports": True,
        }

    try:
        permissions = json.loads(user.permissions or "{}")

        if not isinstance(permissions, dict):
            return {}

        allowed_pages = {
            "dashboard",
            "products",
            "units",
            "products_in",
            "billing",
            "stock",
            "reports",
        }

        return {
            page: permissions.get(page) is True
            for page in allowed_pages
        }

    except (ValueError, TypeError):
        return {}


def require_admin(
    current_user: User = Depends(get_current_user)
):
    if not is_registered_admin(current_user):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Admin access required"
        )

    return current_user


def require_page_permission(page: str):
    def permission_checker(
        current_user: User = Depends(get_current_user)
    ):
        if is_registered_admin(current_user):
            return current_user

        permissions = get_user_permissions(current_user)

        if permissions.get(page) is not True:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="You do not have permission to access this page"
            )

        return current_user

    return permission_checker