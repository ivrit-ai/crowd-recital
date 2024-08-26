from contextlib import AbstractContextManager
from typing import Callable, Iterator
from uuid import UUID

from sqlalchemy.orm import defer
from sqlmodel import Session, select

from models.text_document import TextDocument


class DocumentsRA:

    def __init__(self, session_factory: Callable[..., AbstractContextManager[Session]]) -> None:
        self.session_factory = session_factory

    def get_all(self, include_text: bool = False) -> Iterator[TextDocument]:
        with self.session_factory() as session:
            return session.exec(select(TextDocument))

    def get_by_id(self, id: UUID) -> TextDocument:
        with self.session_factory() as session:
            results = session.exec(select(TextDocument).filter(TextDocument.id == id))
            return results.first()

    def get_by_owner_id(self, owner_id: str, include_text: bool = False) -> Iterator[TextDocument]:
        with self.session_factory() as session:
            select_stmt = select(TextDocument).filter(TextDocument.owner_id == owner_id)
            if not include_text:
                select_stmt = select_stmt.options(defer(TextDocument.text))
            results = session.exec(select_stmt)
            return results.all()

    def upsert(self, text_document: TextDocument) -> None:
        with self.session_factory() as session:
            session.merge(text_document)
            session.commit()
            return text_document
