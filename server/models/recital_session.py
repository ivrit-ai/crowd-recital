from enum import Enum
from typing import Optional
from uuid import UUID

from pydantic import BaseModel
from sqlmodel import Field, Relationship, SQLModel

from .mixins.date_fields import DateFieldsMixin
from .text_document import TextDocument
from .user import User


class SessionStatus(str, Enum):
    ACTIVE = "active"
    ENDED = "ended"
    AGGREGATED = "aggregated"
    UPLOADED = "uploaded"
    DISCARDED = "discarded"


class RecitalSessionBase(SQLModel, DateFieldsMixin):
    id: str = Field(default=None, primary_key=True)
    status: str = Field(index=True, default=SessionStatus.ACTIVE)


class RecitalSession(RecitalSessionBase, SQLModel, table=True):
    __tablename__ = "recital_sessions"

    user_id: UUID = Field(index=True, foreign_key="users.id")
    document_id: Optional[UUID] = Field(index=True, nullable=True, foreign_key="text_documents.id")

    source_audio_filename: str = Field(nullable=True)
    main_audio_filename: str = Field(nullable=True)
    light_audio_filename: str = Field(nullable=True)
    text_filename: str = Field(nullable=True)

    user: Optional["User"] = Relationship(back_populates="recital_sessions")
    text_segments: list["RecitalTextSegment"] = Relationship(back_populates="recital_session")
    audio_segments: list["RecitalAudioSegment"] = Relationship(back_populates="recital_session")
    document: Optional["TextDocument"] = Relationship(back_populates="recital_sessions")


class SessionTextDocument(BaseModel):
    id: str
    title: str


class RecitalSessionRead(RecitalSessionBase):
    document: Optional[SessionTextDocument] = None
