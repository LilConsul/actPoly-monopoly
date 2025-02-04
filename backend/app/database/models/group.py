from sqlalchemy import Integer, String
from sqlalchemy.orm import Mapped, mapped_column, relationship
from app.database.models.base import Base


class Group(Base):
    # Corresponds to table "groups"
    name: Mapped[str] = mapped_column(String(255), nullable=False)
    color: Mapped[str] = mapped_column(String(7), nullable=False)  # e.g. "#FFFFFF"
    property_count: Mapped[int] = mapped_column(Integer, default=0)

    # One-to-many: a group can have several properties.
    properties: Mapped[list["Property"]] = relationship(
        "Property", back_populates="group", cascade="all, delete-orphan"
    )
