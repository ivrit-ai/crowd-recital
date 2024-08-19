import re
from typing import Annotated, Optional
from uuid import UUID
import wave
import pathlib

from dependency_injector.wiring import inject, Provide
from fastapi import APIRouter, Depends, File, UploadFile, Path, Query
from fastapi.exceptions import HTTPException
from nanoid import generate
from pydantic import BaseModel
from torch import Value


from ..containers import Container
from ..models.recital_session import RecitalSession
from ..models.recital_text_segment import RecitalTextSegment
from ..models.recital_audio_segment import RecitalAudioSegment
from ..models.text_document import TextDocumentResponse
from ..resource_access.recitals_ra import RecitalsRA
from ..managers.document_manager import DocumentManager
from .dependencies.users import User, get_speaker_user
from . import users

router = APIRouter()


class NewRecitalSessionRequestBody(BaseModel):
    document_id: Optional[UUID]


@router.put("/new-recital-session")
@inject
async def new_recital_session(
    speaker_user: Annotated[User, Depends(get_speaker_user)],
    new_session_request: NewRecitalSessionRequestBody,
    recitals_ra: RecitalsRA = Depends(Provide[Container.recitals_ra]),
):
    recital_session = RecitalSession(
        id=generate(),
        user_id=speaker_user.id,
        document_id=new_session_request.document_id,
    )
    recitals_ra.upsert(recital_session)

    return {"session_id": recital_session.id}


class TextSegmentRequestBody(BaseModel):
    seek_end: float
    text: str


@router.post("/upload-text-segment/{session_id}")
@inject
async def upload_text_segment(
    session_id: Annotated[str, Path(title="Session id of the transcript")],
    segment: TextSegmentRequestBody,
    speaker_user: Annotated[User, Depends(get_speaker_user)],
    recitals_ra: RecitalsRA = Depends(Provide[Container.recitals_ra]),
):
    recital_session = recitals_ra.get_by_id_and_user_id(session_id, speaker_user.id)
    if not recital_session:
        raise HTTPException(status_code=404, detail="Recital session not found")

    text_segment = RecitalTextSegment(recital_session=recital_session, seek_end=segment.seek_end, text=segment.text)
    recitals_ra.add_text_segment(text_segment)

    return {"message": "Text segment uploaded successfully"}


def parse_mime_type(mime_type: str):
    # Regular expression to extract key-value pairs from the mime type
    pattern = re.compile(r"(\w+)=([\w.]+)")
    params = dict(pattern.findall(mime_type))
    return params


@router.post("/upload-audio-segment/{session_id}/{segment_id}")
@inject
async def upload_audio_segment(
    session_id: Annotated[str, Path(title="Session id of the audio segment")],
    segment_id: Annotated[str, Path(title="Id of the audio segment")],
    speaker_user: Annotated[User, Depends(get_speaker_user)],
    audio_data: UploadFile = File(...),
    recitals_ra: RecitalsRA = Depends(Provide[Container.recitals_ra]),
):
    recital_session = recitals_ra.get_by_id_and_user_id(session_id, speaker_user.id)
    if not recital_session:
        raise HTTPException(status_code=404, detail="Recital session not found")

    # Read the MIME type
    mime_type = audio_data.content_type
    print(f"MIME type: {mime_type}")

    # Parse the MIME type to extract parameters
    params = parse_mime_type(mime_type)
    rate = int(params.get("rate", 16000))  # Default to 16000 if not provided
    encoding = params.get("encoding", "signed-int")
    bits = int(params.get("bits", 16))
    channels = int(params.get("channels", 1))

    print(f"Rate: {rate}, Encoding: {encoding}, Bits: {bits}")

    if encoding != "signed-int":
        return {"error": "Unsupported encoding - only PCM encoding is supported."}

    # Read the audio file content
    audio_content = await audio_data.read()

    # Write the raw PCM data to a WAV file
    file_name = f"{session_id}_{segment_id}.wav"
    with wave.open(str(pathlib.Path("data", file_name)), "wb") as wav_file:
        wav_file.setnchannels(channels)
        wav_file.setsampwidth(bits // 8)  # Convert bits to bytes per sample
        wav_file.setframerate(rate)
        wav_file.writeframes(audio_content)

    audio_segment = RecitalAudioSegment(recital_session=recital_session, sequential=segment_id, filename=file_name)
    recitals_ra.add_audio_segment(audio_segment)

    return {"message": "Audio uploaded successfully"}


class CreateDocumentFromSourceBody(BaseModel):
    source: str
    source_type: str


@router.post("/create_document_from_source")
@inject
async def create_document_from_source(
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

    return {"document_id": document.id, "title": document.title}


@router.get("/documents")
@inject
async def get_documents(
    speaker_user: Annotated[User, Depends(get_speaker_user)],
    include_text: Annotated[bool, Query()] = False,
    document_manager: DocumentManager = Depends(Provide[Container.document_manager]),
):
    return document_manager.load_own_documents(speaker_user, include_text=include_text)


@router.get("/documents/{document_id}")
@inject
async def get_document_by_id(
    document_id: Annotated[UUID, Path(title="Document id to load")],
    document_manager: DocumentManager = Depends(Provide[Container.document_manager]),
) -> TextDocumentResponse:
    text_doc = document_manager.load_document(document_id)
    if not text_doc:
        raise HTTPException(status_code=404, detail="Document not found")

    return TextDocumentResponse(**text_doc.model_dump(exclude=["owner_id"]))


@router.get("/status")
@inject
def get_status():
    return {"status": "OK"}


router.include_router(users.router)
