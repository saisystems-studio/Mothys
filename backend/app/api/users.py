
import json

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from sqlalchemy.exc import IntegrityError
from pwdlib import PasswordHash

from app.core.database import get_db
from app.models.users import User
from app.models.role import Role
from app.schemas.users import (
    UserCreate,
    UserUpdate,
    UserStatusUpdate,
    UserPasswordUpdate,
    UserResponse
)
from app.core.security import require_admin


router = APIRouter(
    prefix="/users",
    tags=["Users"],
    dependencies=[Depends(require_admin)]
)

password_hash = PasswordHash.recommended()

ALLOWED_PERMISSIONS = {
    "dashboard",
    "products",
    "units",
    "products_in",
    "billing",
    "stock",
    "reports",
}


def validate_permissions(permissions):
    if not isinstance(permissions, dict):
        raise HTTPException(
            status_code=400,
            detail="Invalid permissions format"
        )

    if any(key not in ALLOWED_PERMISSIONS for key in permissions):
        raise HTTPException(
            status_code=400,
            detail="Invalid page permission"
        )

    if any(type(value) is not bool for value in permissions.values()):
        raise HTTPException(
            status_code=400,
            detail="Permission values must be true or false"
        )

    return json.dumps(permissions)


def get_local_user_or_404(user_id: int, db: Session):
    user = db.query(User).filter(
        User.id == user_id
    ).first()

    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found"
        )

    if user.auth_provider != "LOCAL":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Nexus accounts cannot be modified through local user management"
        )

    return user


def user_response(user):
    try:
        permissions = json.loads(user.permissions or "{}")
        if not isinstance(permissions, dict):
            permissions = {}
    except (ValueError, TypeError):
        permissions = {}

    user.permissions = permissions
    return user


@router.get("/", response_model=list[UserResponse])
def get_users(db: Session = Depends(get_db)):
    users = db.query(User).order_by(User.id).all()
    return [user_response(user) for user in users]


@router.get("/{user_id}", response_model=UserResponse)
def get_user(
    user_id: int,
    db: Session = Depends(get_db)
):
    user = db.query(User).filter(
        User.id == user_id
    ).first()

    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found"
        )

    return user_response(user)


@router.post(
    "/",
    response_model=UserResponse,
    status_code=status.HTTP_201_CREATED
)
def create_user(
    user_data: UserCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_admin)
):
    existing_user = db.query(User).filter(
        User.username == user_data.username
    ).first()

    if existing_user:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="Username already exists"
        )

    if user_data.email is not None:
        existing_email = db.query(User).filter(
            User.email == str(user_data.email)
        ).first()

        if existing_email:
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail="Email address already exists"
            )

    role = db.query(Role).filter(
        Role.id == user_data.role_id
    ).first()

    if not role:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Role not found"
        )

    if user_data.role_id == 1:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Local users cannot be assigned the Admin role"
        )

    new_user = User(
        username=user_data.username,
        name=user_data.name,
        email=str(user_data.email) if user_data.email else None,
        contact_number=user_data.contact_number,
        password_hash=password_hash.hash(user_data.password),
        auth_provider="LOCAL",
        role_id=user_data.role_id,
        permissions=validate_permissions(user_data.permissions),
        created_by=current_user.id
    )

    try:
        db.add(new_user)
        db.commit()
        db.refresh(new_user)

        return user_response(new_user)

    except IntegrityError:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="User could not be created because of duplicate data"
        )


@router.patch("/{user_id}", response_model=UserResponse)
def update_user(
    user_id: int,
    user_data: UserUpdate,
    db: Session = Depends(get_db)
):
    user = get_local_user_or_404(user_id, db)

    update_data = user_data.model_dump(exclude_unset=True)

    if not update_data:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="No update information provided"
        )

    if "username" in update_data and update_data["username"] is not None:
        existing_user = db.query(User).filter(
            User.username == update_data["username"],
            User.id != user_id
        ).first()

        if existing_user:
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail="Username already exists"
            )

    if "email" in update_data:
        email = update_data["email"]

        if email is not None:
            existing_email = db.query(User).filter(
                User.email == str(email),
                User.id != user_id
            ).first()

            if existing_email:
                raise HTTPException(
                    status_code=status.HTTP_409_CONFLICT,
                    detail="Email address already exists"
                )

            update_data["email"] = str(email)

    if "role_id" in update_data and update_data["role_id"] is not None:
        if update_data["role_id"] == 1:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Local users cannot be assigned the Admin role"
            )

        role = db.query(Role).filter(
            Role.id == update_data["role_id"]
        ).first()

        if not role:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Role not found"
            )

    if "permissions" in update_data:
        update_data["permissions"] = validate_permissions(
            update_data["permissions"]
        )

    for field, value in update_data.items():
        setattr(user, field, value)

    try:
        db.commit()
        db.refresh(user)

        return user_response(user)

    except IntegrityError:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="User update conflicts with existing database data"
        )


@router.patch("/{user_id}/status", response_model=UserResponse)
def update_user_status(
    user_id: int,
    status_data: UserStatusUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_admin)
):
    user = get_local_user_or_404(user_id, db)

    if user.id == current_user.id and not status_data.is_active:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="You cannot deactivate your own account"
        )

    user.is_active = status_data.is_active

    try:
        db.commit()
        db.refresh(user)

        return user_response(user)

    except Exception:
        db.rollback()
        raise


@router.patch("/{user_id}/password", response_model=UserResponse)
def reset_user_password(
    user_id: int,
    password_data: UserPasswordUpdate,
    db: Session = Depends(get_db)
):
    user = get_local_user_or_404(user_id, db)

    user.password_hash = password_hash.hash(
        password_data.new_password
    )

    user.must_change_password = True

    try:
        db.commit()
        db.refresh(user)

        return user_response(user)

    except Exception:
        db.rollback()
        raise
