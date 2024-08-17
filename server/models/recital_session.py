from datetime import datetime
from typing import Optional

from sqlmodel import Field, SQLModel, Relationship, Column, func, DateTime


class RecitalSession(SQLModel, table=True):
    __tablename__ = "recital_sessions"

    id: str = Field(default=None, primary_key=True)
    user_id: str = Field(index=True, foreign_key="users.id")

    created_at: datetime = Field(sa_column=Column(DateTime, server_default=func.now()))

    user: Optional["User"] = Relationship(back_populates="recital_sessions")
    text_segments: list["RecitalTextSegment"] = Relationship(back_populates="recital_session")
    audio_segments: list["RecitalAudioSegment"] = Relationship(back_populates="recital_session")
