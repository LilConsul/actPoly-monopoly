import enum
from sqlalchemy import ForeignKey, Enum
from sqlalchemy.orm import Mapped, mapped_column, relationship
from app.database.models.base import Base


class SpecialTypeEnum(enum.Enum):
    go = "go"
    chest = "chest"
    chance = "chance"
    tax = "tax"
    jail = "jail"
    casino = "casino"
    goto_jail = "goto_jail"


class Special(Base):
    # Corresponds to table "specials"
    tile_id: Mapped[int] = mapped_column(ForeignKey("tiles.id"), unique=True, nullable=False)
    type: Mapped[SpecialTypeEnum] = mapped_column(
        Enum(SpecialTypeEnum, name="special_type_enum"), nullable=False
    )

    # Relationship to tile
    tile: Mapped["Tile"] = relationship("Tile", back_populates="special")
