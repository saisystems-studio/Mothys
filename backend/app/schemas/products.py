
# from datetime import datetime
# from decimal import Decimal

# from pydantic import BaseModel, ConfigDict, Field


# class ProductBase(BaseModel):
#     product_name: str
#     unit_id: int


# class ProductCreate(ProductBase):
#     opening_stock: Decimal | None = Field(
#         default=None,
#         ge=0,
#         max_digits=15,
#         decimal_places=3
#     )


# class ProductUpdate(BaseModel):
#     product_name: str | None = None
#     unit_id: int | None = None
#     is_active: bool | None = None


# class ProductResponse(ProductBase):
#     id: int
#     is_active: bool
#     created_at: datetime
#     updated_at: datetime

#     model_config = ConfigDict(from_attributes=True)






from datetime import datetime
from decimal import Decimal

from pydantic import (
    BaseModel,
    ConfigDict,
    Field,
    field_validator
)


class ProductBase(BaseModel):
    product_name: str
    unit_ids: list[int] = Field(min_length=1)

    @field_validator("unit_ids")
    @classmethod
    def validate_unit_ids(cls, value):
        if len(value) != len(set(value)):
            raise ValueError("Duplicate unit IDs are not allowed")
        return value


class ProductCreate(ProductBase):
    opening_stock: Decimal | None = Field(
        default=None,
        ge=0,
        max_digits=15,
        decimal_places=3
    )


class ProductUpdate(BaseModel):
    product_name: str | None = None

    unit_ids: list[int] | None = Field(
        default=None,
        min_length=1
    )

    is_active: bool | None = None

    @field_validator("unit_ids")
    @classmethod
    def validate_unit_ids(cls, value):
        if value is not None and len(value) != len(set(value)):
            raise ValueError("Duplicate unit IDs are not allowed")
        return value


class ProductResponse(BaseModel):
    id: int
    product_name: str

    # Default unit
    unit_id: int

    # All assigned units
    unit_ids: list[int]

    is_active: bool
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)
