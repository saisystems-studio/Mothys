
# from fastapi import APIRouter, Depends, HTTPException, status
# from sqlalchemy.orm import Session

# from app.core.database import get_db
# from app.core.security import verify_password, create_access_token
# from app.models.users import User
# from app.schemas.auth import LoginRequest, TokenResponse
# from app.core.security import get_current_user
# from app.core.security import require_admin
# router = APIRouter(prefix="/auth", tags=["Authentication"])


# @router.post("/login", response_model=TokenResponse)
# def login(
#     login_data: LoginRequest,
#     db: Session = Depends(get_db)
# ):
#     user = (
#         db.query(User)
#         .filter(
#             User.username == login_data.username,
#             User.auth_provider == "LOCAL",
#             User.is_active == True
#         )
#         .first()
#     )

#     if not user or not user.password_hash:
#         raise HTTPException(
#             status_code=status.HTTP_401_UNAUTHORIZED,
#             detail="Invalid username or password"
#         )

#     if not verify_password(login_data.password, user.password_hash):
#         raise HTTPException(
#             status_code=status.HTTP_401_UNAUTHORIZED,
#             detail="Invalid username or password"
#         )

#     token = create_access_token({
#         "sub": str(user.id),
#         "role": user.role_id,
#         "auth_provider": user.auth_provider
#     })

#     return {
#         "access_token": token,
#         "token_type": "bearer"
#     }
# @router.get("/me")
# def get_logged_in_user(
#     current_user=Depends(get_current_user)
# ):
#     return {
#         "id": current_user.id,
#         "username": current_user.username,
#         "name": current_user.name,
#         "role_id": current_user.role_id,
#         "auth_provider": current_user.auth_provider
#     }
# @router.get("/admin-test")
# def admin_test(
#     current_user=Depends(require_admin)
# ):
#     return {
#         "message": "Admin access granted",
#         "username": current_user.username,
#         "role_id": current_user.role_id
#     }




import logging
import re
from datetime import datetime, timezone
from uuid import uuid4

from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel, field_validator
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.core.security import (
    verify_password,
    create_access_token,
    get_current_user,
    require_admin,
)
from app.models.users import User
from app.schemas.auth import LoginRequest, TokenResponse
from app.services.nexus_service import register_customer, verify_login, NexusError

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/auth", tags=["Authentication"])

# Role given to a customer who registers (the company owner / admin).
CUSTOMER_ROLE_ID = 1

# OPEN QUESTION for senior: which license states may log in.
ALLOWED_LICENSE_STATES = {"ACTIVE"}

_EMAIL_RE = re.compile(r"^[^@\s]+@[^@\s]+\.[^@\s]+$")


class RegisterRequest(BaseModel):
    name: str
    email: str
    contact_number: str

    @field_validator("name")
    @classmethod
    def validate_name(cls, value: str) -> str:
        value = value.strip()
        if not 2 <= len(value) <= 150:
            raise ValueError("Name must be 2 to 150 characters")
        return value

    @field_validator("email")
    @classmethod
    def validate_email(cls, value: str) -> str:
        value = value.strip().lower()
        if len(value) > 255 or not _EMAIL_RE.match(value):
            raise ValueError("Enter a valid email address")
        return value

    @field_validator("contact_number")
    @classmethod
    def validate_contact_number(cls, value: str) -> str:
        # Allow spaces, dashes, brackets and a leading +; keep digits only.
        digits = re.sub(r"[\s\-()]", "", value.strip()).lstrip("+")
        if not re.fullmatch(r"\d{7,15}", digits):
            raise ValueError("Contact number must be 7 to 15 digits")
        return digits


class RegisterResponse(BaseModel):
    message: str


@router.post(
    "/register",
    response_model=RegisterResponse,
    status_code=status.HTTP_201_CREATED
)
def register(
    data: RegisterRequest,
    db: Session = Depends(get_db)
):
    # Same email already registered in Mothys.
    if db.query(User).filter(User.email == data.email).first():
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="This email is already registered"
        )

    # Stable identifier Mothys sends to Nexus (max 100 characters).
    external_customer_id = f"MOTHYS-{uuid4().hex[:12].upper()}"

    # 1. Register the customer in Nexus. Nexus creates the User ID and
    #    password and emails them to the customer.
    try:
        nexus = register_customer(
            external_customer_id=external_customer_id,
            customer_name=data.name,
            email=data.email,
            contact_number=data.contact_number,
        )
    except NexusError as e:
        logger.warning(
            "Nexus registration failed: code=%s status=%s request_id=%s",
            e.code, e.status_code, e.request_id
        )

        if e.code in ("DUPLICATE_EMAIL", "CUSTOMER_ALREADY_REGISTERED"):
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail="This email is already registered"
            )

        if e.code == "VALIDATION_ERROR":
            raise HTTPException(
                status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
                detail=e.fields or e.message
            )

        if e.code == "NEXUS_UNREACHABLE":
            raise HTTPException(
                status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
                detail="Registration service is not reachable. Please try again."
            )

        # UNAUTHENTICATED / PROJECT_MISMATCH / anything else = our setup problem.
        raise HTTPException(
            status_code=status.HTTP_502_BAD_GATEWAY,
            detail="Registration could not be completed. Please contact support."
        )

    nexus_user_id = str(nexus["user_id"])

    # 2. Save the customer in Mothys. Username = Nexus User ID.
    #    No password is stored here: Nexus owns it.
    try:
        user = User(
            nexus_user_id=nexus_user_id,
            username=nexus_user_id,
            name=data.name,
            email=data.email,
            contact_number=data.contact_number,
            password_hash=None,
            auth_provider="NEXUS",
            role_id=CUSTOMER_ROLE_ID,
        )
        db.add(user)
        db.commit()

    except IntegrityError:
        db.rollback()
        # Nexus already has this customer but Mothys could not save it.
        logger.error(
            "Nexus customer created but local save failed: "
            "external_customer_id=%s nexus_customer_id=%s nexus_user_id=%s",
            external_customer_id, nexus.get("customer_id"), nexus_user_id
        )
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="Registration could not be completed. Please contact support."
        )

    except Exception:
        db.rollback()
        logger.error(
            "Nexus customer created but local save failed: "
            "external_customer_id=%s nexus_customer_id=%s nexus_user_id=%s",
            external_customer_id, nexus.get("customer_id"), nexus_user_id
        )
        raise

    return {
        "message": "Registration successful. Your User ID and password have been sent to your email."
    }



@router.post("/login", response_model=TokenResponse)
def login(
    login_data: LoginRequest,
    db: Session = Depends(get_db)
):
    invalid = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Invalid username or password"
    )

    user = (
        db.query(User)
        .filter(
            User.username == login_data.username,
            User.is_active == True
        )
        .first()
    )

    if not user:
        raise invalid

    # All users authenticate locally.
    # Nexus is used only during registration.

    if not user.password_hash:
        raise invalid

    if not verify_password(
        login_data.password,
        user.password_hash
    ):
        raise invalid

    user.last_login = datetime.now(timezone.utc).replace(
        tzinfo=None
    )

    db.commit()

    token = create_access_token({
        "sub": str(user.id),
        "role": user.role_id,
        "auth_provider": user.auth_provider
    })

    return {
        "access_token": token,
        "token_type": "bearer"
    }


@router.get("/me")
def get_logged_in_user(
    current_user=Depends(get_current_user)
):
    return {
        "id": current_user.id,
        "username": current_user.username,
        "name": current_user.name,
        "role_id": current_user.role_id,
        "auth_provider": current_user.auth_provider
    }


@router.get("/admin-test")
def admin_test(
    current_user=Depends(require_admin)
):
    return {
        "message": "Admin access granted",
        "username": current_user.username,
        "role_id": current_user.role_id
    }