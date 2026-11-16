
from sqlalchemy import Column, Integer, String, DateTime, text
from app.core.database import Base


class Role(Base):
    __tablename__ = "roles"

    id = Column(Integer, primary_key=True, index=True)
    role_name = Column(String(50), nullable=False, unique=True)
    created_at = Column(
        DateTime,
        nullable=False,
        server_default=text("SYSDATETIME()")
    )
