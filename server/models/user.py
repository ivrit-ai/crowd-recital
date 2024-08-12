from enum import Enum, IntEnum

from typing import Optional
from sqlmodel import Field, Relationship, SQLModel


class UserGroupEnum(IntEnum):
    admin = 100
    speaker = 200


class User(SQLModel, table=True):
    id: str = Field(default=None, primary_key=True)
    email: str
    email_verified: bool = Field(default=False)
    name: str
    picture: Optional[str]
    is_active: bool = Field(default=True)

    # group_id: Optional[UserGroupEnum]
