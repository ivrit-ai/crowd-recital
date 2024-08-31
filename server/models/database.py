"""Database module."""

import logging
from contextlib import AbstractContextManager, contextmanager
from typing import Callable

from sqlalchemy import orm
from sqlmodel import Session, SQLModel, create_engine

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
