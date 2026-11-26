
from sqlalchemy import (
    Column,
    Integer,
    String,
    Boolean,
    DateTime,
    ForeignKey,
    CheckConstraint,
    Text,
    text
)

from app.core.database import Base


class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)

    nexus_user_id = Column(String(100), nullable=True)
    username = Column(String(100), nullable=False, unique=True)
    name = Column(String(150), nullable=False)
    email = Column(String(255), nullable=True)
    contact_number = Column(String(30), nullable=True)

    password_hash = Column(String(255), nullable=True)
    auth_provider = Column(String(10), nullable=False)

    role_id = Column(Integer, ForeignKey("roles.id"), nullable=False)
    permissions = Column(
    Text,
    nullable=True,
    server_default=text("'{}'")
)

    is_active = Column(Boolean, nullable=False, server_default=text("1"))
    must_change_password = Column(
        Boolean, nullable=False, server_default=text("0")
    )

    last_login = Column(DateTime, nullable=True)

    created_by = Column(Integer, ForeignKey("users.id"), nullable=True)

    created_at = Column(
        DateTime, nullable=False, server_default=text("SYSDATETIME()")
    )

    updated_at = Column(
        DateTime, nullable=False, server_default=text("SYSDATETIME()")
    )

    __table_args__ = (
        CheckConstraint(
            """
            (auth_provider = 'NEXUS'
             AND nexus_user_id IS NOT NULL
             AND password_hash IS NULL)
            OR
            (auth_provider = 'LOCAL'
             AND nexus_user_id IS NULL
             AND password_hash IS NOT NULL)
            """,
            name="CK_users_auth_provider"
        ),
    )

