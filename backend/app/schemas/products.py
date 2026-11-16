
from datetime import datetime
from decimal import Decimal

from pydantic import BaseModel, ConfigDict, Field


class ProductBase(BaseModel):
    product_name: str
    unit_id: int


class ProductCreate(ProductBase):
    opening_stock: Decimal | None = Field(
        default=None,
        ge=0,
        max_digits=15,
        decimal_places=3
    )


class ProductUpdate(BaseModel):
    product_name: str | None = None
    unit_id: int | None = None
    is_active: bool | None = None


class ProductResponse(ProductBase):
    id: int
    is_active: bool
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)
