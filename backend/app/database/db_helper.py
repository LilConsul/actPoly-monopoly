from asyncio import current_task
from sqlalchemy.ext.asyncio import (
    create_async_engine,
    async_sessionmaker,
    async_scoped_session,
    AsyncSession,
)
from sqlalchemy.pool import NullPool
from contextlib import asynccontextmanager
from app.settings import settings


class DatabaseHelper:
    def __init__(self, url: str, echo: bool = False):
        self.engine = create_async_engine(
            url=url, echo=echo, poolclass=NullPool, pool_pre_ping=True
        )
        self.session_factory = async_sessionmaker(
            bind=self.engine, expire_on_commit=False, autoflush=False, autocommit=False
        )

    def get_scoped_session(self):
        """Returns a scoped session tied to the current task."""
        return async_scoped_session(
            session_factory=self.session_factory, scopefunc=current_task
        )

    async def session_dependency(self) -> AsyncSession:
        """
        Provides a session dependency for FastAPI with proper session lifecycle management.
        This method can be used as a FastAPI dependency.
        """
        session = self.get_scoped_session()
        try:
            yield session
        except Exception as e:
            await session.rollback()
            raise e
        finally:
            await session.close()


db_helper = DatabaseHelper(settings.DATABASE_URL, settings.DEBUG)
