from sqlalchemy.ext.asyncio import AsyncAttrs, AsyncSession
from sqlalchemy.orm import DeclarativeBase, declared_attr, mapped_column, Mapped
from sqlalchemy import select
import inflect

p = inflect.engine()


class Base(AsyncAttrs, DeclarativeBase):
    __abstract__ = True

    id: Mapped[int] = mapped_column(primary_key=True)

    @declared_attr
    def __tablename__(cls) -> str:
        return p.plural(cls.__name__.lower())

    @classmethod
    async def find_one(cls, session: AsyncSession, **filters):
        query = select(cls).filter_by(**filters)
        result = await session.execute(query)
        return result.scalars().first()
