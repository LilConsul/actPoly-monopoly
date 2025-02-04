from sqlalchemy import String, Boolean, select,or_
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import Mapped, mapped_column, relationship
from app.database.models.base import Base
from typing import TYPE_CHECKING

if TYPE_CHECKING:
    from .player import Player


class User(Base):
    # Corresponds to table "users"
    email: Mapped[str] = mapped_column(String(255), nullable=False, unique=True)
    username: Mapped[str] = mapped_column(String(255), nullable=False, unique=True)
    password: Mapped[str] = mapped_column(String(255), nullable=False)

    is_verified: Mapped[bool] = mapped_column(Boolean, default=False)
    is_admin: Mapped[bool] = mapped_column(Boolean, default=False)

    # One-to-one relationship with Player.
    player: Mapped["Player"] = relationship("Player", back_populates="user", uselist=False)

    @classmethod
    async def select_by_email_username(cls, session: AsyncSession, email: str, username: str):
        query = select(cls).where(
            or_(
                cls.email == email,
                cls.username == username
            )
        )
        result = await session.execute(query)
        return result.scalars().one_or_none()
