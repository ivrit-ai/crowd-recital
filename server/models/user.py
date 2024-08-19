from enum import Enum, IntEnum

from typing import Optional
from sqlmodel import Field, Relationship, SQLModel

ADMIN_GROUP_NAME = "admin"
SPEAKER_GROUP_NAME = "speaker"


class User(SQLModel, table=True):
    __tablename__ = "users"

    id: str = Field(default=None, primary_key=True)
    email: str
    email_verified: bool = Field(default=False)
    name: str
    picture: Optional[str]
    is_active: bool = Field(default=True)

    group: Optional[str] = Field(default=None)

    recital_sessions: list["RecitalSession"] = Relationship(back_populates="user")
    text_documents: list["TextDocument"] = Relationship(back_populates="owner")
