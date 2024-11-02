from datetime import datetime
import uuid
from enum import Enum
from typing import Optional

from pydantic import NonNegativeInt, field_validator
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


class UserMetadataUpdate(UserMetadataBase):
    year_of_birth: Optional[NonNegativeInt] = Field(default=None)
    biological_sex: Optional[BiologicalSexEnum] = Field(default=None)

    @field_validator("year_of_birth")
    @classmethod
    def year_of_birth_allowed(cls, v: int):
        # 0 is an indication that user does not wish to specify this value - allow it
        # otherwise we expect year ranges 1920-<16 years back from current year>
        if v != 0:
            current_year = datetime.now().year
            if v < 1920 or v > current_year - 16:
                raise ValueError("Year of birth must be between 1920 and {}".format(current_year - 16))
        return v
