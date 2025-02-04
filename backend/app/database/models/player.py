from sqlalchemy import ForeignKey, Integer
from sqlalchemy.orm import Mapped, mapped_column, relationship
from app.database.models.base import Base


class Player(Base):
    # Corresponds to table "players"
    # Use the User.id as the primary key for players.
    id: Mapped[int] = mapped_column(ForeignKey("users.id"), primary_key=True)

    games_played: Mapped[int] = mapped_column(Integer, default=0)
    games_won: Mapped[int] = mapped_column(Integer, default=0)
    games_lost: Mapped[int] = mapped_column(Integer, default=0)

    # One-to-one relationship with User.
    user: Mapped["User"] = relationship("User", back_populates="player", uselist=False)
