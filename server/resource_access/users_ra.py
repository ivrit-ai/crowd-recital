from contextlib import AbstractContextManager
from typing import Callable, Iterator

from sqlmodel import Session, select

from ..models.user import User


class UsersRA:

    def __init__(self, session_factory: Callable[..., AbstractContextManager[Session]]) -> None:
        self.session_factory = session_factory

    def get_all(self) -> Iterator[User]:
        with self.session_factory() as session:
            statement = select(User)
            return session.exec(statement)

    def get_by_id(self, id: str) -> User:
        with self.session_factory() as session:
            statement = select(User).filter(User.id == id)
            results = session.exec(statement)
            return results.first()

    def get_by_email(self, email: str) -> User:
        with self.session_factory() as session:
            statement = select(User).filter(User.email == email)
            results = session.exec(statement)
            return results.first()

    def upsert(self, user: User) -> None:
        with self.session_factory() as session:
            session.merge(user)
            session.commit()
            return user
