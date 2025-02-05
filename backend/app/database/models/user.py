from sqlalchemy import String, Boolean, select, or_
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import Mapped, mapped_column, relationship
from app.database.models.base import Base
from typing import TYPE_CHECKING

from app.user.hash import verify_password

if TYPE_CHECKING:
    from .player import Player


class User(Base):
    # Corresponds to table "users"
    email: Mapped[str] = mapped_column(String(255), nullable=False, unique=True, index=True)
    username: Mapped[str] = mapped_column(String(255), nullable=False, unique=True, index=True)
    password: Mapped[str] = mapped_column(String(255), nullable=False)

    is_verified: Mapped[bool] = mapped_column(Boolean, default=False)
    is_admin: Mapped[bool] = mapped_column(Boolean, default=False)

    # One-to-one relationship with Player.
    player: Mapped["Player"] = relationship(
        "Player",
        back_populates="user",
        cascade="all, delete-orphan",
        single_parent=True,
        uselist=False
    )

    @classmethod
    async def find_by_email_and_username(cls, session: AsyncSession, email: str, username: str):
        query = select(cls).where(
            or_(
                cls.email == email,
                cls.username == username
            )
        )
        result = await session.execute(query)
        return result.scalars().one_or_none()

    @classmethod
    async def find_by_id(cls, session: AsyncSession, user_id: int):
        query = select(cls).where(cls.id == user_id)
        result = await session.execute(query)
        return result.scalars().one_or_none()

    @classmethod
    async def authenticate(cls,
                           session: AsyncSession,
                           password: str,
                           email: str | None = None,
                           username: str | None = None):
        if email:
            query = select(cls).where(cls.email == email)
        elif username:
            query = select(cls).where(cls.username == username)
        else:
            return False
        result = await session.execute(query)
        user = result.scalars().one_or_none()

        if not user or not verify_password(password, user.password):
            return False
        return user
