
from datetime import datetime
from decimal import Decimal
from typing import Literal

from pydantic import BaseModel, ConfigDict, Field


class StockMovementCreate(BaseModel):
    product_id: int
    unit_id: int | None = None
    movement_type: Literal["IN"]
    quantity: Decimal = Field(gt=0)


class StockMovementResponse(BaseModel):
    id: int
    product_id: int
    unit_id: int | None = None
    movement_type: str
    quantity: Decimal
    voucher_item_id: int | None = None
    created_by: int
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)
from pydantic import field_validator

class StockAdjustmentCreate(BaseModel):
    product_id: int
    unit_id: int | None = None
    quantity: Decimal  # signed: negative reduces stock, positive increases it

    @field_validator("quantity")
    @classmethod
    def quantity_not_zero(cls, v: Decimal):
        if v == 0:
            raise ValueError("quantity must not be 0")
        return v