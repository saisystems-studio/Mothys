from datetime import datetime
from decimal import Decimal
from decimal import Decimal
from pydantic import BaseModel
from sqlalchemy import (
    Column,
    Integer,
    String,
    DateTime,
    Numeric,
    ForeignKey,
    CheckConstraint,
    Index
)

from app.core.database import Base


class StockMovement(Base):
    __tablename__ = "stock_movements"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)

    product_id = Column(
        Integer,
        ForeignKey("products.id"),
        nullable=False
    )

    # Unit this movement was recorded in. Stock is kept per product + unit,
    # and units are never converted into each other.
    unit_id = Column(
        Integer,
        ForeignKey("units.id"),
        nullable=False
    )

    movement_type = Column(
        String(20),
        nullable=False
    )

    quantity = Column(
        Numeric(15, 3),
        nullable=False
    )

    voucher_item_id = Column(
        Integer,
        ForeignKey("voucher_items.id"),
        nullable=True
    )

    created_by = Column(
        Integer,
        ForeignKey("users.id"),
        nullable=False
    )

    created_at = Column(
        DateTime,
        nullable=False,
        default=datetime.now
    )

    __table_args__ = (
        CheckConstraint(
            "movement_type IN ('OPENING', 'IN', 'OUT', 'ADJUSTMENT')",
            name="CK_stock_movements_movement_type"
        ),
        CheckConstraint(
            "quantity <> 0 AND (movement_type = 'ADJUSTMENT' OR quantity > 0)",
            name="CK_stock_movements_quantity"
        ),
        Index(
            "UX_stock_movements_voucher_item",
            "voucher_item_id",
            unique=True,
            mssql_where=voucher_item_id.isnot(None)
        ),
    )
    