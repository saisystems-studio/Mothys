
from sqlalchemy import Column, Integer, String, Boolean, DateTime, text
from app.core.database import Base


class Unit(Base):
    __tablename__ = "units"

    id = Column(Integer, primary_key=True, index=True)

    unit_name = Column(String(50), nullable=False, unique=True)

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
