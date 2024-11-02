import uuid
from datetime import datetime
from enum import StrEnum
from typing import Optional

from sqlmodel import TIMESTAMP, Field, Relationship, SQLModel

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

    def is_admin(self) -> bool:
        return self.group == UserGroups.ADMIN


class User(UserBase, DateFieldsMixin, table=True):
    __tablename__ = "users"

    id: uuid.UUID = Field(default_factory=uuid.uuid4, primary_key=True)
    email: str
    email_verified: bool = Field(default=False)
    name: str
    picture: Optional[str]

    agreement_signed_version: Optional[str] = Field(default=None, nullable=True)
    agreement_signed_at: Optional[datetime] = Field(
        nullable=True,
        sa_type=TIMESTAMP(timezone=True),
    )

    group: Optional[str] = Field(default=None)

    recital_sessions: list["RecitalSession"] = Relationship(back_populates="user")
    text_documents: list["TextDocument"] = Relationship(back_populates="owner")
    user_metadata: Optional["UserMetadata"] = Relationship(back_populates="user")


class UserCreate(UserBase):
    pass


class UserUpdate(SQLModel):
    email: Optional[str] = None
    email_verified: Optional[bool] = None
    name: Optional[str] = None
    picture: Optional[str] = None
    group: Optional[str] = None


class UserDelete(SQLModel):
    pass
