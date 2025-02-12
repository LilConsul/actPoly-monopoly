from sqlalchemy import String, Boolean, select, or_
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import Mapped, mapped_column, relationship
from app.database.models.base import Base
from .player import Player
from app.user.hash import verify_password



class User(Base):
    email: Mapped[str] = mapped_column(String(255), nullable=False, unique=True, index=True)
    username: Mapped[str] = mapped_column(String(255), nullable=False, unique=True, index=True)
    password: Mapped[str] = mapped_column(String(255), nullable=False)
    is_verified: Mapped[bool] = mapped_column(Boolean, default=False)
    is_admin: Mapped[bool] = mapped_column(Boolean, default=False)

    player: Mapped["Player"] = relationship(
        "Player", back_populates="user", cascade="all, delete-orphan", single_parent=True, uselist=False
    )

    @classmethod
    async def find_by_email_and_username(cls, session: AsyncSession, email: str, username: str):
        query = select(cls).filter(or_(cls.email == email, cls.username == username))
        result = await session.execute(query)
        return result.scalars().first()

    @classmethod
    async def get_profile(cls, session: AsyncSession, user_id: int):
        query = select(
            cls.id,
            cls.username,
            cls.email,
            cls.is_admin,
            Player.games_lost,
            Player.games_played,
            Player.games_won
        ).filter(cls.id == user_id).join(Player, cls.player)
        result = await session.execute(query)
        return result.mappings().first()

    @classmethod
    async def authenticate(cls, session: AsyncSession, password: str, **kwargs):
        if not kwargs:
            return None

        user = await cls.find_one(session, **kwargs)
        return user if user and verify_password(password, user.password) else None


    @classmethod
    async def find_by_email(cls, session: AsyncSession, email: str):
        return await cls.find_one(session, email=email)

    @classmethod
    async def find_by_id(cls, session: AsyncSession, user_id: int):
        return await cls.find_one(session, id=user_id)

    @classmethod
    async def find_username_by_id(cls, session: AsyncSession, user_id: int):
        query = select(cls.username).filter(cls.id == user_id)
        result = await session.execute(query)
        return result.scalars().first()
