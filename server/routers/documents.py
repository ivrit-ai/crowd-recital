from typing import Annotated, Optional

from dependency_injector.wiring import Provide, inject
from fastapi import APIRouter, Depends, File, Form, UploadFile
from fastapi.exceptions import HTTPException
from fastcrud import FilterConfig, JoinConfig
from pydantic import BaseModel

from containers import Container
from managers.document_manager import DocumentManager
from models.database import get_async_session
from models.text_document import (
    TextDocument,
    TextDocumentListRead,
    TextDocumentOwner,
    TextDocumentRead,
)
from models.user import User

from .crud.utils import FastCrudWithOrFilters, create_dynamic_filters_dep, gen_get_multi, gen_get_single
from .dependencies.analytics import Tracker
from .dependencies.users import User, get_speaker_user

router = APIRouter()


class CreateDocumentFromSourceBody(BaseModel):
    source: str
    source_type: str
    title: Optional[str] = None


max_source_file_size_mb = 10


@router.post("/from_source_file")
@inject
async def create_document_from_source(
    track_event: Tracker,
    speaker_user: Annotated[User, Depends(get_speaker_user)],
    source_file: UploadFile = File(...),
    title: Annotated[str, Form()] = None,
    document_manager: DocumentManager = Depends(Provide[Container.document_manager]),
):

    # Make sure the content type is one of the supported types
    if source_file.content_type not in [
        "text/plain",
        "text/html",
        # "application/pdf"
    ]:
        raise HTTPException(status_code=422, detail="Unsupported file type")

    # Be mindful of the size - we should not upload huge bodies of text.
    # Stop at 10MB
    if source_file.size > max_source_file_size_mb * 1024 * 1024:
        raise HTTPException(status_code=422, detail=f"File too large - Limit is {max_source_file_size_mb} mb")

    try:
        document = await document_manager.create_from_source_file(
            source_file=source_file.file,
            source_content_type=source_file.content_type,
            source_filename=source_file.filename,
            title=title,
            owner=speaker_user,
        )
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))

    track_event("Documents Created", {"source_type": document.source_type, "document_id": str(document.id)})
    return {"document_id": document.id, "title": document.title}


@router.post("/from_source")
@inject
async def create_document_from_source(
    track_event: Tracker,
    speaker_user: Annotated[User, Depends(get_speaker_user)],
    create_from_source: CreateDocumentFromSourceBody,
    document_manager: DocumentManager = Depends(Provide[Container.document_manager]),
):
    try:
        document = document_manager.create_from_source(
            create_from_source.source,
            create_from_source.source_type,
            title=create_from_source.title,
            owner=speaker_user,
        )
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))

    track_event("Documents Created", {"source_type": create_from_source.source_type, "document_id": str(document.id)})
    return {"document_id": document.id, "title": document.title}


# Crud Generated API


document_crud = FastCrudWithOrFilters(TextDocument)
document_filter_config = FilterConfig(source_type=None, owner_id=None, include_public=False)


def preprocess_filters(**kwargs) -> dict:
    filtered_params = {}

    # Ownership filter processing
    calling_user: User = kwargs.pop("__calling_user")
    is_admin = calling_user.is_admin()
    include_public = kwargs.pop("include_public", None) == "1"

    if is_admin:
        if kwargs.get("owner_id", None) is not None:
            if include_public:
                filtered_params["__or__specific_or_public"] = {"owner_id": kwargs.pop("owner_id"), "public": True}
            else:
                # the owner_id filter applies as is
                pass
        else:
            kwargs.pop("owner_id", None)  # Clear it - meaningless for admin
    else:
        # You don't get to decide which user you see. hmm.
        # regardless of the specified owner_id - we force the calling user
        # owner id
        kwargs["owner_id"] = calling_user.id
        if include_public:
            filtered_params["__or__mine_or_public"] = {"owner_id": kwargs.pop("owner_id"), "public": True}

    return filtered_params, kwargs


router.add_api_route(
    "/{id}",
    gen_get_single(document_crud, get_async_session, schema_to_select=TextDocumentRead, only_admins_see_others=False),
    methods=["GET"],
)
router.add_api_route(
    "",
    gen_get_multi(
        document_crud,
        get_async_session,
        create_dynamic_filters_dep(
            document_filter_config, inject_current_user=True, preprocess_filters=preprocess_filters
        ),
        join_configs=[
            JoinConfig(
                model=User,
                join_on=User.id == TextDocument.owner_id,
                join_prefix="owner_",
                schema_to_select=TextDocumentOwner,
                join_type="left",
            )
        ],
        schema_to_select=TextDocumentListRead,
    ),
    methods=["GET"],
)
