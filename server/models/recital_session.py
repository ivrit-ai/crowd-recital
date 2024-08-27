from datetime import datetime
from typing import Optional
from uuid import UUID

from sqlmodel import Field, SQLModel, Relationship

from .mixins.date_fields import DateFieldsMixin
from .user import User
from .text_document import TextDocument


class RecitalSession(DateFieldsMixin, SQLModel, table=True):
    __tablename__ = "recital_sessions"

    id: str = Field(default=None, primary_key=True)
    user_id: str = Field(index=True, foreign_key="users.id")
    document_id: Optional[UUID] = Field(index=True, nullable=True, foreign_key="text_documents.id")
    status: str = Field(index=True, default="active")

    user: Optional["User"] = Relationship(back_populates="recital_sessions")
    text_segments: list["RecitalTextSegment"] = Relationship(back_populates="recital_session")
    audio_segments: list["RecitalAudioSegment"] = Relationship(back_populates="recital_session")
    document: Optional["TextDocument"] = Relationship(back_populates="recital_sessions")
