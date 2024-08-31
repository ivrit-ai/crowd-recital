from typing import Optional
from uuid import UUID

from dependency_injector.wiring import inject

from engines.extraction_engine import ExtractionEngine
from models.text_document import WIKI_ARTICLE_SOURCE_TYPE, TextDocument
from models.user import User
from resource_access.documents_ra import DocumentsRA


class DocumentManager:
    @inject
    def __init__(self, extraction_engine: ExtractionEngine, documents_ra: DocumentsRA) -> None:
        self.extraction_engine = extraction_engine
        self.documents_ra = documents_ra

    def create_from_source(self, source: str, source_type: str, owner: Optional[User] = None) -> TextDocument:
        # Validate the source
        if not source or source_type != WIKI_ARTICLE_SOURCE_TYPE:
            raise ValueError("Invalid source or source type")

        # Extract text from the source
        extracted_text = self.extraction_engine.extract_text_document(source, source_type)

        # Add any provided metadata
        title = extracted_text.text[:60]
        if "title" in extracted_text.metadata:
            title = extracted_text.metadata["title"]

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
