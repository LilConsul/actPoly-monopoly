import enum
from sqlalchemy import Enum, Integer
from sqlalchemy.orm import Mapped, mapped_column, relationship
from app.database.models.base import Base
from typing import TYPE_CHECKING

if TYPE_CHECKING:
    from .property import Property
    from .railway import Railway
    from .company import Company
    from .special import Special


class TileTypeEnum(enum.Enum):
    property = "property"
    railway = "railway"
    company = "company"
    special = "special"


class Tile(Base):
    # Corresponds to table "tiles"
    index: Mapped[int] = mapped_column(Integer, unique=True, nullable=False)
    type: Mapped[TileTypeEnum] = mapped_column(
        Enum(TileTypeEnum, name="tile_type_enum"), nullable=False
    )

    # Optional one-to-one relationships; these will be set only for the proper tile type.
    property: Mapped["Property"] = relationship("Property", back_populates="tile", uselist=False)
    railway: Mapped["Railway"] = relationship("Railway", back_populates="tile", uselist=False)
    company: Mapped["Company"] = relationship("Company", back_populates="tile", uselist=False)
    special: Mapped["Special"] = relationship("Special", back_populates="tile", uselist=False)
