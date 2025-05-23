import pathlib
import re
from mimetypes import guess_extension
from typing import Annotated, Optional
from uuid import UUID

from dependency_injector.wiring import Provide, inject
from fastapi import APIRouter, Depends, File, Path, UploadFile
from fastapi.exceptions import HTTPException
from fastcrud import FastCRUD, FilterConfig, JoinConfig
from nanoid import generate
from pydantic import BaseModel

from containers import Container
from errors import MissingSessionError
from managers.recital_manager import RecitalManager, TextSegmentRequestBody
from models.database import get_async_session
from models.recital_audio_segment import RecitalAudioSegment
from models.recital_session import (
    RecitalSession,
    RecitalSessionRead,
    SessionStatus,
    SessionTextDocument,
)
from models.text_document import TextDocument
from resource_access.recitals_content_ra import RecitalsContentRA
from resource_access.recitals_ra import RecitalsRA

from .crud.utils import create_dynamic_filters_dep, gen_get_multi, gen_get_single
from .dependencies.analytics import Tracker
from .dependencies.users import User, get_speaker_user
from .types import SessionPreview

router = APIRouter()


class NewRecitalSessionRequestBody(BaseModel):
    document_id: Optional[UUID]


recital_ids_alphabet = "0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ_abcdefghijklmnopqrstuvwxyz"


@router.put("")
@inject
async def new_recital_session(
    track_event: Tracker,
    speaker_user: Annotated[User, Depends(get_speaker_user)],
    new_session_request: NewRecitalSessionRequestBody,
    recitals_ra: RecitalsRA = Depends(Provide[Container.recitals_ra]),
):
    recital_session = RecitalSession(
        id=generate(alphabet=recital_ids_alphabet),
        user_id=speaker_user.id,
        document_id=new_session_request.document_id,
    )
    recitals_ra.upsert(recital_session)

    track_event(
        "Recital Session Created",
        {"session_id": recital_session.id, "document_id": recital_session.document_id},
    )
    return {"session_id": recital_session.id}


class EndSessionPayload(BaseModel):
    discard_last_n_text_segments: Optional[int] = 0


@router.post("/{session_id}/end")
@inject
async def end_recital_session(
    track_event: Tracker,
    session_id: Annotated[str, Path(title="Session id of the transcript")],
    speaker_user: Annotated[User, Depends(get_speaker_user)],
    end_session_payload: Optional[EndSessionPayload] = EndSessionPayload(),
    recital_manager: RecitalManager = Depends(Provide[Container.recital_manager]),
):
    try:
        ended = recital_manager.end_session(speaker_user, session_id, end_session_payload.discard_last_n_text_segments)

        if ended:
            track_event(
                "Recital Session Ended",
                {
                    "session_id": session_id,
                },
            )
    except MissingSessionError:
        raise HTTPException(status_code=404, detail="Recital session not found")

    return {"message": "Recital session ended successfully"}


@router.delete("/{session_id}")
@inject
async def disavow_recital_session(
    track_event: Tracker,
    session_id: Annotated[str, Path(title="Session id of the transcript")],
    speaker_user: Annotated[User, Depends(get_speaker_user)],
    recital_manager: RecitalManager = Depends(Provide[Container.recital_manager]),
    recitals_ra: RecitalsRA = Depends(Provide[Container.recitals_ra]),
):
    recital_session = recitals_ra.get_by_id_and_user_id(session_id, speaker_user.id)
    if not recital_session:
        raise HTTPException(status_code=404, detail="Recital session not found")

    recital_session.disavowed = True
    recitals_ra.upsert(recital_session)
    recital_manager.schedule_session_finalization_job()

    track_event(
        "Recording Session Disavowed",
        {
            "session_id": session_id,
        },
    )
    return {"message": "Recital session discarded successfully"}


@router.post("/{session_id}/upload-text-segment")
@inject
async def upload_text_segment(
    track_event: Tracker,
    session_id: Annotated[str, Path(title="Session id of the transcript")],
    segment: TextSegmentRequestBody,
    speaker_user: Annotated[User, Depends(get_speaker_user)],
    recital_manager: RecitalManager = Depends(Provide[Container.recital_manager]),
):
    try:
        recital_manager.add_text_segment(session_id, speaker_user, segment)
    except MissingSessionError:
        raise HTTPException(status_code=404, detail="Recital session not found")

    track_event(
        "Text Segment Uploaded",
        {
            "session_id": session_id,
            "seek_end": str(segment.seek_end),
            "text_length": len(segment.text),
        },
    )
    return {"message": "Text segment uploaded successfully"}


def parse_mime_type(mime_type: str):
    # Regular expression to extract key-value pairs from the mime type
    pattern = re.compile(r"(\w+)=([\w.]+)")
    params = dict(pattern.findall(mime_type))
    return params


@router.post("/{session_id}/upload-audio-segment/{segment_id}")
@inject
async def upload_audio_segment(
    track_event: Tracker,
    session_id: Annotated[str, Path(title="Session id of the audio segment")],
    segment_id: Annotated[str, Path(title="Id of the audio segment")],
    speaker_user: Annotated[User, Depends(get_speaker_user)],
    audio_data: UploadFile = File(...),
    recitals_ra: RecitalsRA = Depends(Provide[Container.recitals_ra]),
    recitals_content_ra: RecitalsContentRA = Depends(Provide[Container.recitals_content_ra]),
):
    recital_session = recitals_ra.get_by_id_and_user_id(session_id, speaker_user.id)
    if not recital_session or recital_session.disavowed:
        raise HTTPException(status_code=404, detail="Recital session not found")

    # Read the MIME type
    mime_type = audio_data.content_type

    # write the file to disk
    file_extension = guess_extension(mime_type.split(";")[0]) or ".bin"
    file_name = f"{session_id}{file_extension}.seg.{segment_id}"
    with open(str(pathlib.Path(recitals_content_ra.get_data_folder(), file_name)), "wb") as buffer:
        buffer.write(await audio_data.read())

    # Byte Size of the uploaded audio file
    audio_data_length = audio_data.size

    recitals_ra.add_audio_segment(
        RecitalAudioSegment(
            filename=file_name,
            mime_type=mime_type,
            recital_session=recital_session,
            sequential=segment_id,
        )
    )

    track_event(
        "Audio Segment Uploaded",
        {
            "session_id": session_id,
            "audio_segment_id": segment_id,
            "mime_type": mime_type,
            "size_bytes": audio_data_length,
        },
    )
    return {"message": "Audio uploaded successfully"}


@router.get("/{session_id}/preview", response_model=SessionPreview)
@inject
async def get_session_preview(
    track_event: Tracker,
    session_id: Annotated[str, Path(title="Session id of the audio segment")],
    speaker_user: Annotated[User, Depends(get_speaker_user)],
    recitals_ra: RecitalsRA = Depends(Provide[Container.recitals_ra]),
    recitals_content_ra: RecitalsContentRA = Depends(Provide[Container.recitals_content_ra]),
) -> SessionPreview:
    recital_session = recitals_ra.get_by_id_and_user_id(session_id, speaker_user.id)
    if not recital_session:
        raise HTTPException(status_code=404, detail="Recital session not found")

    if recital_session.status in [SessionStatus.ACTIVE, SessionStatus.ENDED, SessionStatus.AGGREGATED]:
        track_event("Session Preview Attempt Before Ready", {"session_id": session_id})
        return SessionPreview(id=recital_session.id, audio_url=None, transcript_url=None)
    elif recital_session.status != SessionStatus.UPLOADED:
        track_event("Session Preview For Invalid Session", {"session_id": session_id})
        raise HTTPException(status_code=404, detail="No preview for this recital session")

    track_event("Session Preview Generated", {"session_id": session_id})
    return SessionPreview(
        id=recital_session.id,
        audio_url=recitals_content_ra.get_url_to_light_audio(recital_session.id),
        transcript_url=recitals_content_ra.get_url_to_transcript(recital_session.id),
    )


# Crud Generated API

session_crud = FastCRUD(RecitalSession)
session_filter_config = FilterConfig(status=None, user_id=None)

join_with_text_doc_config = JoinConfig(
    model=TextDocument,
    join_on=TextDocument.id == RecitalSession.document_id,
    join_prefix="document_",
    schema_to_select=SessionTextDocument,
    join_type="left",
)


def preprocess_filters(**kwargs) -> dict:
    # Ownership filter processing
    calling_user: User = kwargs.pop("__calling_user")
    is_admin = calling_user.is_admin()

    if is_admin and kwargs.get("user_id", None) is not None:
        # the owner_id filter applies as is
        pass
    else:
        # By default - users see their own session
        kwargs["user_id"] = calling_user.id

    return {}, kwargs


router.add_api_route(
    "/{id}",
    gen_get_single(
        session_crud,
        get_async_session,
        schema_to_select=RecitalSessionRead,
        join_configs=[join_with_text_doc_config],
    ),
    methods=["GET"],
)
router.add_api_route(
    "",
    gen_get_multi(
        session_crud,
        get_async_session,
        create_dynamic_filters_dep(
            session_filter_config, inject_current_user=True, preprocess_filters=preprocess_filters
        ),
        join_configs=[join_with_text_doc_config],
        schema_to_select=RecitalSessionRead,
    ),
    methods=["GET"],
)
