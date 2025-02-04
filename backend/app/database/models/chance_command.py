import enum
from sqlalchemy import Enum, Text
from sqlalchemy.orm import Mapped, mapped_column
from app.database.models.base import Base


class ChanceCommandTypeEnum(enum.Enum):
    chance = "chance"
    chest = "chest"
    tax = "tax"


class ChanceCommand(Base):
    # Corresponds to table "chance_commands"
    type: Mapped[ChanceCommandTypeEnum] = mapped_column(
        Enum(ChanceCommandTypeEnum, name="chance_command_type_enum")
    )
    description: Mapped[str] = mapped_column(Text, nullable=False)
    command: Mapped[str] = mapped_column(Text)
