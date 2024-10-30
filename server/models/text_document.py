import uuid
from typing import ClassVar, Optional

from pydantic import BaseModel
from pydantic.json_schema import SkipJsonSchema
from sqlmodel import JSON, Column, Field, Relationship, SQLModel
from sympy import public

from .mixins.date_fields import DateFieldsMixin
from .user import User

WIKI_ARTICLE_SOURCE_TYPE = "wiki-article"
PLAIN_TEXT_SOURCE_TYPE = "plain-text"
FILE_UPLOAD_SOURCE_TYPE = "file-upload"


class TextDocumentBase(DateFieldsMixin, SQLModel):
    __tablename__ = "text_documents"

    id: uuid.UUID = Field(default_factory=uuid.uuid4, primary_key=True)
    source: str
    source_type: str
    lang: Optional[str] = Field(default="he")
    text: list[list[str]] = Field(default_factory=dict, sa_column=Column(JSON))
    title: Optional[str]

    public: bool = Field(default=False, nullable=True)


class TextDocument(TextDocumentBase, table=True):
    owner_id: Optional[uuid.UUID] = Field(default=None, foreign_key="users.id")
    owner: Optional[User] = Relationship(back_populates="text_documents")

    recital_sessions: list["RecitalSession"] = Relationship(back_populates="document")


class TextDocumentRead(TextDocumentBase):
    pass


class TextDocumentListRead(DateFieldsMixin, BaseModel):
    id: uuid.UUID
    source: ClassVar[str]
    source_type: str
    lang: Optional[str]
    title: Optional[str]
    public: bool


class TextDocumentOwner(BaseModel):
    name: str
