from typing import BinaryIO, Optional
from uuid import UUID

from dependency_injector.wiring import inject

# Must leak this type into the manager to keep async processing of the uploaded file
from fastapi import UploadFile

from engines.extraction_engine import ExtractionEngine
from models.text_document import (
    PLAIN_TEXT_SOURCE_TYPE,
    WIKI_ARTICLE_SOURCE_TYPE,
    FILE_UPLOAD_SOURCE_TYPE,
    TextDocument,
)
from models.user import User
from resource_access.documents_ra import DocumentsRA


class DocumentManager:
    @inject
    def __init__(self, extraction_engine: ExtractionEngine, documents_ra: DocumentsRA) -> None:
        self.extraction_engine = extraction_engine
        self.documents_ra = documents_ra

    async def create_from_source_file(
        self,
        source_file: BinaryIO,
        source_content_type: str,
        source_filename: Optional[str] = None,
        title: Optional[str] = None,
        owner: Optional[User] = None,
    ) -> TextDocument:
        extracted_text = self.extraction_engine.extract_text_document_from_file(source_file, source_content_type)

        title = title or extracted_text.metadata.get("title") or source_filename or None

        doc = self.documents_ra.upsert(
            TextDocument(
                source=source_filename,
                source_type=FILE_UPLOAD_SOURCE_TYPE,
                text=extracted_text.text,
                title=title,
                owner=owner,
            )
        )

        # Return the document
        return doc

    def create_from_source(
        self, source: str, source_type: str, title: Optional[str] = None, owner: Optional[User] = None
    ) -> TextDocument:
        # Validate the source
        if not source or source_type not in [WIKI_ARTICLE_SOURCE_TYPE, PLAIN_TEXT_SOURCE_TYPE]:
            raise ValueError("Invalid source or source type")

        # Extract text from the source
        extracted_text = self.extraction_engine.extract_text_document(source, source_type, title)

        # Add any provided metadata
        title = None
        if "title" in extracted_text.metadata:
            if extracted_text.metadata["title"]:
                title = extracted_text.metadata["title"]
        if not title and len(extracted_text.text) > 0:
            title = extracted_text.text[0][0]

        # Create the document and store it
        doc = self.documents_ra.upsert(
            TextDocument(source=source, source_type=source_type, text=extracted_text.text, title=title, owner=owner)
        )

        # Return the document
        return doc

    def load_document(self, document_id: UUID) -> TextDocument:
        # TODO - no permissions enforced atm.
        doc = self.documents_ra.get_by_id(document_id)
        return doc

    def load_own_documents(self, user: User, include_text: bool = False) -> list[TextDocument]:
        if not user:
            raise ValueError("User is required")

        return self.documents_ra.get_by_owner_id(user.id, include_text=include_text)
