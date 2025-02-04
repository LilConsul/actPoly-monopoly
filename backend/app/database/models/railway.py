from sqlalchemy import ForeignKey, Float, String, Text
from sqlalchemy.orm import Mapped, mapped_column, relationship
from app.database.models.base import Base


class Railway(Base):
    # Corresponds to table "railways"
    tile_id: Mapped[int] = mapped_column(ForeignKey("tiles.id"), unique=True, nullable=False)

    # Display information
    name: Mapped[str] = mapped_column(String(255), nullable=False)
    description: Mapped[str] = mapped_column(Text)

    # Prices
    price: Mapped[float] = mapped_column(Float, nullable=False)
    mortgage: Mapped[float] = mapped_column(Float, nullable=False)

    # Rent values
    rent_1: Mapped[float] = mapped_column(Float, nullable=False)
    rent_2: Mapped[float] = mapped_column(Float, nullable=False)
    rent_3: Mapped[float] = mapped_column(Float, nullable=False)
    rent_4: Mapped[float] = mapped_column(Float, nullable=False)

    # Relationship to tile
    tile: Mapped["Tile"] = relationship("Tile", back_populates="railway")
