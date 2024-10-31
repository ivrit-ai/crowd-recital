import uuid
from enum import Enum
from typing import Optional

from pydantic import PositiveInt
from sqlmodel import Field, Relationship, SQLModel

from .mixins.date_fields import DateFieldsMixin
from .user import User


class BiologicalSexEnum(str, Enum):
    male = "male"
    female = "female"
    unspecified = "unspecified"


class UserMetadataBase(SQLModel):
    year_of_birth: Optional[int] = Field(default=None)
    biological_sex: Optional[str] = Field(default=None)


class UserMetadata(UserMetadataBase, DateFieldsMixin, table=True):
    __tablename__ = "users_metadata"

    id: uuid.UUID = Field(primary_key=True, foreign_key="users.id")
    user: User = Relationship(back_populates="user_metadata")


class UserMetadataUpdate(SQLModel):
    year_of_birth: Optional[PositiveInt] = Field(default=None)
    biological_sex: Optional[BiologicalSexEnum] = Field(default=None)
