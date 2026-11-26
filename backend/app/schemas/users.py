from datetime import datetime
from typing import Optional

from pydantic import BaseModel, ConfigDict, EmailStr, Field


class UserBase(BaseModel):
    username: str
    name: str
    email: Optional[EmailStr] = None
    contact_number: Optional[str] = None
    role_id: int


class UserCreate(UserBase):
    password: str = Field(min_length=1)
    permissions: dict[str, bool] = Field(default_factory=dict)


class UserUpdate(BaseModel):
    username: str | None = None
    name: str | None = None
    email: Optional[EmailStr] = None
    contact_number: str | None = None
    role_id: int | None = None
    permissions: dict[str, bool] | None = None


class UserStatusUpdate(BaseModel):
    is_active: bool


class UserPasswordUpdate(BaseModel):
    new_password: str = Field(min_length=1)


class UserResponse(UserBase):
    id: int
    auth_provider: str
    permissions: dict[str, bool] = Field(default_factory=dict)
    is_active: bool
    must_change_password: bool
    last_login: Optional[datetime] = None
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)