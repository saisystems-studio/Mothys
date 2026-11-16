
from sqlalchemy import (
    Column,
    Integer,
    String,
    Numeric,
    ForeignKey,
    CheckConstraint
)

from app.core.database import Base


class VoucherItem(Base):
    __tablename__ = "voucher_items"

    id = Column(Integer, primary_key=True, index=True)

    voucher_id = Column(
        Integer,
        ForeignKey("vouchers.id"),
        nullable=False
    )

    product_id = Column(
        Integer,
        ForeignKey("products.id"),
        nullable=False
    )

    unit_id = Column(
        Integer,
        ForeignKey("units.id"),
        nullable=False
    )

    product_name_snapshot = Column(String(200), nullable=False)

    unit_name_snapshot = Column(String(50), nullable=False)

    quantity = Column(Numeric(15, 3), nullable=False)

    __table_args__ = (
        CheckConstraint(
            "quantity > 0",
            name="CK_voucher_items_quantity"
        ),
    )
