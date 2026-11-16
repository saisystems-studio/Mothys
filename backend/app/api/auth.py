
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.core.security import verify_password, create_access_token
from app.models.users import User
from app.schemas.auth import LoginRequest, TokenResponse
from app.core.security import get_current_user
from app.core.security import require_admin
router = APIRouter(prefix="/auth", tags=["Authentication"])


@router.post("/login", response_model=TokenResponse)
def login(
    login_data: LoginRequest,
    db: Session = Depends(get_db)
):
    user = (
        db.query(User)
        .filter(
            User.username == login_data.username,
            User.auth_provider == "LOCAL",
            User.is_active == True
        )
        .first()
    )

    if not user or not user.password_hash:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid username or password"
        )

    if not verify_password(login_data.password, user.password_hash):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid username or password"
        )

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