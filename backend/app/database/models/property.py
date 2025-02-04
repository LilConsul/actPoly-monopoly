from sqlalchemy import ForeignKey, Float, String, Text
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.database.models.base import Base


class Property(Base):
    # Corresponds to table "property"
    tile_id: Mapped[int] = mapped_column(ForeignKey("tiles.id"), nullable=False)
    group_id: Mapped[int] = mapped_column(ForeignKey("groups.id"), nullable=False)

    # Display information
    name: Mapped[str] = mapped_column(String(255))
    description: Mapped[str] = mapped_column(Text)

    # Prices
    price: Mapped[float] = mapped_column(Float, nullable=False)
    mortgage: Mapped[float] = mapped_column(Float, nullable=False)
    house_price: Mapped[float] = mapped_column(Float, nullable=False)
    hotel_price: Mapped[float] = mapped_column(Float, nullable=False)

    # Rent values
    rent_0_house: Mapped[float] = mapped_column(Float, nullable=False)
    rent_1_house: Mapped[float] = mapped_column(Float, nullable=False)
    rent_2_house: Mapped[float] = mapped_column(Float, nullable=False)
    rent_3_house: Mapped[float] = mapped_column(Float, nullable=False)
    rent_4_house: Mapped[float] = mapped_column(Float, nullable=False)
    rent_hotel: Mapped[float] = mapped_column(Float, nullable=False)

    # Relationships
    tile: Mapped["Tile"] = relationship("Tile", back_populates="property")
    group: Mapped["Group"] = relationship("Group", back_populates="properties")
