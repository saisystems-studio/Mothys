
# from sqlalchemy import (
#     Column,
#     Integer,
#     String,
#     Boolean,
#     DateTime,
#     ForeignKey,
#     text
# )

# from app.core.database import Base


# class Product(Base):
#     __tablename__ = "products"

#     id = Column(Integer, primary_key=True, index=True)

#     product_name = Column(String(200), nullable=False, unique=True)

#     unit_id = Column(
#         Integer,
#         ForeignKey("units.id"),
#         nullable=False
#     )

#     is_active = Column(
#         Boolean,
#         nullable=False,
#         server_default=text("1")
#     )

#     created_at = Column(
#         DateTime,
#         nullable=False,
#         server_default=text("SYSDATETIME()")
#     )

#     updated_at = Column(
#         DateTime,
#         nullable=False,
#         server_default=text("SYSDATETIME()")
#     )







from sqlalchemy import (
    Column,
    Integer,
    String,
    Boolean,
    DateTime,
    ForeignKey,
    Table,
    text
)
from sqlalchemy.orm import relationship

from app.core.database import Base


# Junction table: one product can have multiple units
product_units = Table(
    "product_units",
    Base.metadata,
    Column(
        "product_id",
        Integer,
        ForeignKey("products.id", ondelete="CASCADE"),
        primary_key=True
    ),
    Column(
        "unit_id",
        Integer,
        ForeignKey("units.id", ondelete="CASCADE"),
        primary_key=True
    )
)


class Product(Base):
    __tablename__ = "products"

    id = Column(Integer, primary_key=True, index=True)

    # Duplicate product names are now allowed.
    product_name = Column(
        String(200),
        nullable=False,
        index=True
    )

    # Retained as the primary/default unit for compatibility.
    unit_id = Column(
        Integer,
        ForeignKey("units.id"),
        nullable=False
    )

    # All units available for this product.
    units = relationship(
        "Unit",
        secondary=product_units,
        lazy="select"
    )

    @property
    def unit_ids(self):
        return [unit.id for unit in self.units]

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
