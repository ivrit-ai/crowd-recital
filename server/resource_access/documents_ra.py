from contextlib import AbstractContextManager
from typing import Callable, Iterator

from sqlmodel import Session

from ..models.document import Document

class DocumentsRA:

    def __init__(self, session_factory: Callable[..., AbstractContextManager[Session]]) -> None:
        self.session_factory = session_factory

    def get_all(self) -> Iterator[Document]:
        with self.session_factory() as session:
            return session.query(Document).all()

    def add(self, text: str) -> None:
        with self.session_factory() as session:
            document = Document(text=text)
            session.add(document)
            session.commit()
            session.refresh(document)
            return document
