import uuid
from enum import StrEnum
from typing import Optional

from sqlmodel import Field, Relationship, SQLModel

from .mixins.date_fields import DateFieldsMixin


class UserGroups(StrEnum):
    ADMIN = "admin"
    SPEAKER = "speaker"


class UserBase(SQLModel):
    email: str
    email_verified: bool = Field(default=False)
    name: str
    picture: Optional[str]

    group: Optional[str] = Field(default=None)


class User(UserBase, DateFieldsMixin, table=True):
    __tablename__ = "users"

    id: uuid.UUID = Field(default_factory=uuid.uuid4, primary_key=True)
    email: str
    email_verified: bool = Field(default=False)
    name: str
    picture: Optional[str]

    group: Optional[str] = Field(default=None)

    recital_sessions: list["RecitalSession"] = Relationship(back_populates="user")
    text_documents: list["TextDocument"] = Relationship(back_populates="owner")


class UserCreate(UserBase):
    pass


# class UserRead(UserBase):
#     id: uuid.UUID


class UserUpdate(SQLModel):
    email: Optional[str] = None
    email_verified: Optional[bool] = None
    name: Optional[str] = None
    picture: Optional[str] = None
    group: Optional[str] = None


class UserDelete(SQLModel):
    pass
