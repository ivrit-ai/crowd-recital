from typing import Container

from anyio import Path
from dependency_injector.wiring import Provide, inject
from fastapi import APIRouter, Depends, HTTPException, Path
from fastcrud import FilterConfig, crud_router
from pydantic import BaseModel

from containers import Container
from managers.recital_manager import RecitalManager
from models.database import get_async_session
from models.user import User, UserCreate, UserUpdate
from resource_access.recitals_content_ra import RecitalsContentRA
from resource_access.recitals_ra import RecitalsRA

from .dependencies.analytics import Tracker
from .dependencies.users import get_admin_user
from .types import SessionPreview

router = APIRouter(dependencies=[Depends(get_admin_user)], tags=["admin"])

## Users

custom_endpoint_names = {
    "create": "",
    "read": "",
    "update": "",
    "read_multi": "",
}

users_filer_config = FilterConfig(email=None, group=None)

user_router = crud_router(
    session=get_async_session,
    model=User,
    include_in_schema=True,
    create_schema=UserCreate,
    update_schema=UserUpdate,
    updated_at_column=None,
    path="/users",
    included_methods=["create", "read", "read_multi", "update"],
    filter_config=users_filer_config,
    endpoint_names=custom_endpoint_names,
)


## Sessions

sessions_router = APIRouter(prefix="/sessions")


@sessions_router.get("/{session_id}/preview", response_model=SessionPreview)
@inject
def get_session_preview(
    track_event: Tracker,
    session_id: str = Path(...),
    recitals_ra: RecitalsRA = Depends(Provide[Container.recitals_ra]),
    recitals_content_ra: RecitalsContentRA = Depends(Provide[Container.recitals_content_ra]),
) -> SessionPreview:
    recital_session = recitals_ra.get_by_id(session_id)
    if not recital_session:
        raise HTTPException(status_code=404, detail="Recital session not found")

    track_event("Session Preview Generated", {"session_id": session_id})
    return SessionPreview(
        id=recital_session.id,
        audio_url=recitals_content_ra.get_url_to_light_audio(recital_session.id),
        transcript_url=recitals_content_ra.get_url_to_transcript(recital_session.id),
    )


@sessions_router.post("/aggregate")
@inject
def aggregate_sessions(
    track_event: Tracker,
    recital_manager: RecitalManager = Depends(Provide[Container.recital_manager]),
) -> None:
    track_event("Session Aggregation Invoked")
    recital_manager.aggregate_ended_sessions()


@sessions_router.post("/upload")
@inject
def upload_sessions(
    track_event: Tracker,
    recital_manager: RecitalManager = Depends(Provide[Container.recital_manager]),
) -> None:
    track_event("Session Upload Invoked")
    recital_manager.upload_aggregated_sessions()


@sessions_router.post("/discard")
@inject
def discard_sessions(
    track_event: Tracker,
    recital_manager: RecitalManager = Depends(Provide[Container.recital_manager]),
) -> None:
    track_event("Session Discard Invoked")
    recital_manager.discard_disavowed_sessions()


@sessions_router.post("/aggregate_and_upload")
@inject
def aggregate_and_upload_sessions(
    track_event: Tracker,
    recital_manager: RecitalManager = Depends(Provide[Container.recital_manager]),
) -> None:
    track_event("Session Aggregation & Upload Invoked")
    recital_manager.aggregate_ended_sessions()
    recital_manager.upload_aggregated_sessions()


router.include_router(user_router)
router.include_router(sessions_router)
