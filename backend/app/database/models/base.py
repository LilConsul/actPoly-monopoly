from sqlalchemy.ext.asyncio import AsyncAttrs
from sqlalchemy.orm import DeclarativeBase, declared_attr, mapped_column, Mapped
import inflect

p = inflect.engine()


class Base(AsyncAttrs, DeclarativeBase):
    __abstract__ = True

    @declared_attr
    def __tablename__(cls) -> str:
        return p.plural(cls.__name__.lower())

    id: Mapped[int] = mapped_column(primary_key=True)