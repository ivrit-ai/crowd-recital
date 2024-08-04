from sqlalchemy import Column, String, Integer, ForeignKey
from sqlalchemy.dialects.postgresql import UUID
import uuid

from .database import Base


class Document(Base):

    __tablename__ = "documents"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    file_uri = Column(String, nullable=True)
    text = Column(String, nullable=False)

    def __repr__(self):
        return f"<Document {self.id}>"
