
from decimal import Decimal

from pydantic import BaseModel, ConfigDict, Field


class VoucherItemCreate(BaseModel):
    product_id: int
    quantity: Decimal = Field(
        gt=0,
        max_digits=15,
        decimal_places=3
    )


class VoucherItemResponse(BaseModel):
    id: int
    voucher_id: int
    product_id: int
    unit_id: int
    product_name_snapshot: str
    unit_name_snapshot: str
    quantity: Decimal

    model_config = ConfigDict(from_attributes=True)
