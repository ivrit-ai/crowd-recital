"""Database module."""

import logging
from contextlib import AbstractContextManager, asynccontextmanager, contextmanager
from typing import AsyncGenerator, Callable

from sqlalchemy import orm
from sqlalchemy.ext.asyncio import create_async_engine
from sqlmodel import Session, SQLModel, create_engine
from sqlmodel.ext.asyncio.session import AsyncSession

from configuration import get_db_connection_str

logger = logging.getLogger(__name__)


class Database:

    def __init__(self, connection_str: str) -> None:
        self._engine = create_engine(connection_str)
        self._session_factory = orm.scoped_session(
            orm.sessionmaker(
                autocommit=False,
                class_=Session,
                autoflush=False,
                bind=self._engine,
            ),
        )

    def create_database(self) -> None:
        SQLModel.metadata.create_all(self._engine)

    def drop_database(self) -> None:
        SQLModel.metadata.drop_all(self._engine)

    def clear_database(self) -> None:
        self.drop_database()
        self.create_database()

    @contextmanager
    def session(self) -> Callable[..., AbstractContextManager[Session]]:
        session: Session = self._session_factory()
        try:
            yield session
        except Exception:
            logger.exception("Session rollback because of exception")
            session.rollback()
            raise
        finally:
            session.close()


# FastCRUD only works with async sessions and expects them in a very
# particular way which does not jive with the DI container we use.
# For that - we expose this async DB connection directly.

async_engine = create_async_engine(get_db_connection_str().replace("postgresql://", "postgresql+asyncpg://"))
async_session = orm.sessionmaker(async_engine, class_=AsyncSession, expire_on_commit=False)


# Database session dependency
async def get_async_session() -> AsyncGenerator[AsyncSession, None]:
    async with async_session() as session:
        yield session
