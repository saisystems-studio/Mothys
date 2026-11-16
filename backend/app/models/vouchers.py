
from sqlalchemy import (
    Column,
    Integer,
    String,
    DateTime,
    Numeric,
    ForeignKey,
    CheckConstraint,
    text
)

from app.core.database import Base


class Voucher(Base):
    __tablename__ = "vouchers"

    id = Column(Integer, primary_key=True, index=True)

    voucher_number = Column(String(50), nullable=False, unique=True)

    voucher_date = Column(
        DateTime,
        nullable=False,
        server_default=text("SYSDATETIME()")
    )

    created_by = Column(
        Integer,
        ForeignKey("users.id"),
        nullable=False
    )

    total_quantity = Column(
        Numeric(15, 3),
        nullable=False,
        server_default=text("0")
    )

    created_at = Column(
        DateTime,
        nullable=False,
        server_default=text("SYSDATETIME()")
    )

    __table_args__ = (
        CheckConstraint(
            "total_quantity >= 0",
            name="CK_vouchers_total_quantity"
        ),
    )
