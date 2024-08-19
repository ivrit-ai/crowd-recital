from typing import Optional
import uuid

from sqlmodel import Field, Relationship, SQLModel, JSON, Column

from .user import User


WIKI_ARTICLE_SOURCE_TYPE = "wiki-article"


class TextDocumentBase(SQLModel):
    __tablename__ = "text_documents"

    id: uuid.UUID = Field(default_factory=uuid.uuid4, primary_key=True)
    source: str
    source_type: str
    text: list[list[str]] = Field(default_factory=dict, sa_column=Column(JSON))
    title: Optional[str]

    


class TextDocument(TextDocumentBase, table=True):
    owner_id: Optional[str] = Field(default=None, foreign_key="users.id")
    owner: Optional["User"] = Relationship(back_populates="text_documents")
    
    recital_sessions: list["RecitalSession"] = Relationship(back_populates="document")


class TextDocumentResponse(TextDocumentBase):
    pass
