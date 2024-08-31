import uuid
from enum import StrEnum
from typing import Optional

from sqlmodel import Field, Relationship, SQLModel

from .mixins.date_fields import DateFieldsMixin


class UserGroups(StrEnum):
    ADMIN = "admin"
    SPEAKER = "speaker"


class User(SQLModel, DateFieldsMixin, table=True):
    __tablename__ = "users"

    id: uuid.UUID = Field(default_factory=uuid.uuid4, primary_key=True)
    email: str
    email_verified: bool = Field(default=False)
    name: str
    picture: Optional[str]

    group: Optional[str] = Field(default=None)

    recital_sessions: list["RecitalSession"] = Relationship(back_populates="user")
    text_documents: list["TextDocument"] = Relationship(back_populates="owner")
