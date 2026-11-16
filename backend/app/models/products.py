
from sqlalchemy import (
    Column,
    Integer,
    String,
    Boolean,
    DateTime,
    ForeignKey,
    text
)

from app.core.database import Base


class Product(Base):
    __tablename__ = "products"

    id = Column(Integer, primary_key=True, index=True)

    product_name = Column(String(200), nullable=False, unique=True)

    unit_id = Column(
        Integer,
        ForeignKey("units.id"),
        nullable=False
    )

    is_active = Column(
        Boolean,
        nullable=False,
        server_default=text("1")
    )

    created_at = Column(
        DateTime,
        nullable=False,
        server_default=text("SYSDATETIME()")
    )

    updated_at = Column(
        DateTime,
        nullable=False,
        server_default=text("SYSDATETIME()")
    )
