from typing import Annotated, Optional
from uuid import UUID

from dependency_injector.wiring import Provide, inject
from fastapi import APIRouter, Depends, FastAPI, Path, Query
from fastapi.exceptions import HTTPException
from pydantic import BaseModel

from containers import Container
from managers.document_manager import DocumentManager
from models.text_document import TextDocumentResponse

from . import admin, sessions, users
from .dependencies.analytics import AnonTracker, Tracker
from .dependencies.users import User, get_speaker_user

router = APIRouter()


class CreateDocumentFromSourceBody(BaseModel):
    source: str
    source_type: str


@router.post("/create_document_from_source")
@inject
async def create_document_from_source(
    track_event: Tracker,
    speaker_user: Annotated[User, Depends(get_speaker_user)],
    create_from_source: CreateDocumentFromSourceBody,
    document_manager: DocumentManager = Depends(Provide[Container.document_manager]),
):
    try:
        document = document_manager.create_from_source(
            create_from_source.source, create_from_source.source_type, owner=speaker_user
        )
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))

    track_event("Documents Created", {"source_type": create_from_source.source_type, "document_id": str(document.id)})
    return {"document_id": document.id, "title": document.title}


@router.get("/documents")
@inject
async def get_documents(
    track_event: Tracker,
    speaker_user: Annotated[User, Depends(get_speaker_user)],
    include_text: Annotated[bool, Query()] = False,
    document_manager: DocumentManager = Depends(Provide[Container.document_manager]),
):
    track_event("Documents Loaded")
    return document_manager.load_own_documents(speaker_user, include_text=include_text)


@router.get("/documents/{document_id}")
@inject
async def get_document_by_id(
    track_event: Tracker,
    document_id: Annotated[UUID, Path(title="Document id to load")],
    document_manager: DocumentManager = Depends(Provide[Container.document_manager]),
) -> TextDocumentResponse:

    text_doc = document_manager.load_document(document_id)
    if not text_doc:
        raise HTTPException(status_code=404, detail="Document not found")

    track_event("Document Loaded", properties={"document_id": str(document_id)})
    return TextDocumentResponse(**text_doc.model_dump(exclude=["owner_id"]))


@router.get("/status")
@inject
def get_status(track_event: AnonTracker):
    track_event("Status Checked", properties={"check_status": "ok"})
    return {"status": "OK"}


router.include_router(users.router)
router.include_router(sessions.router, prefix="/sessions")
router.include_router(admin.router, prefix="/admin")

api_app = FastAPI()
api_app.include_router(router, prefix="")
