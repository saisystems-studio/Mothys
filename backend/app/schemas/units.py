
from datetime import datetime
from pydantic import BaseModel, ConfigDict


class UnitBase(BaseModel):
    unit_name: str


class UnitCreate(UnitBase):
    pass


class UnitUpdate(BaseModel):
    unit_name: str | None = None
    is_active: bool | None = None


class UnitResponse(UnitBase):
    id: int
    is_active: bool
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)
