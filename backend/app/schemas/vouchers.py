
from datetime import datetime
from decimal import Decimal

from pydantic import BaseModel, ConfigDict, Field

from app.schemas.voucher_items import (
    VoucherItemCreate,
    VoucherItemResponse
)


class VoucherCreate(BaseModel):
    items: list[VoucherItemCreate] = Field(min_length=1)


class VoucherResponse(BaseModel):
    id: int
    voucher_number: str
    voucher_date: datetime
    created_by: int
    total_quantity: Decimal
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)
class VoucherUpdate(BaseModel):
    voucher_date: datetime
    items: list[VoucherItemCreate] = Field(min_length=1)
from datetime import date, datetime
from decimal import Decimal

from pydantic import BaseModel, ConfigDict, Field

from app.schemas.voucher_items import (
    VoucherItemCreate,
    VoucherItemResponse
)


class VoucherCreate(BaseModel):
    items: list[VoucherItemCreate] = Field(min_length=1)


class VoucherUpdate(BaseModel):
    voucher_date: date
    items: list[VoucherItemCreate] = Field(min_length=1)


class VoucherResponse(BaseModel):
    id: int
    voucher_number: str
    voucher_date: datetime
    created_by: int
    total_quantity: Decimal
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)