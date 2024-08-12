# from sqlalchemy import Column, String, Integer, ForeignKey
# from sqlalchemy.dialects.postgresql import UUID
# import uuid

# from .database import Base

from typing import Optional
from sqlmodel import Field, SQLModel


class Document(SQLModel):
    id: Optional[int] = Field(default=None, primary_key=True)
    text: str
