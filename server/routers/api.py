import re
from typing import Annotated
import wave
import pathlib

from dependency_injector.wiring import inject
from fastapi import (
    APIRouter,
    Depends,
    File,
    UploadFile,
    Path,
)
from nanoid import generate
from pydantic import BaseModel

from .dependencies.users import User, get_valid_user
from . import users


router = APIRouter()


class TextSegment(BaseModel):
    end: float
    text: str


@router.put("/new-recital-session")
@inject
async def new_recital_session(active_user: Annotated[User, Depends(get_valid_user)]):
    # TODO - this should go into the DB
    # create a new session id
    # return the session id
    return {"session_id": generate()}


@router.post("/upload-text-segment/{session_id}")
@inject
async def upload_text_segment(
    active_user: Annotated[User, Depends(get_valid_user)],
    session_id: Annotated[str, Path(title="Session id of the transcript")],
    segment: TextSegment,
):
    # TODO - this should go into the DB

    # to a file names "{session_id}.txt"
    # append the text to the file (Create if file does not exist)
    # each line is {end}, {text}
    output_folder = pathlib.Path("./data")
    with open(output_folder / f"{session_id}.txt", "a") as f:
        f.write(f"{segment.end}, {segment.text}\n")

    return {"message": "Text segment uploaded successfully"}


# @router.get("/test")
# @inject
# def get_list(
#     documents_ra: DocumentsRA = Depends(Provide[Container.documents_ra]),
# ):
#     l = documents_ra.get_all()
#     print(l)
#     return "t"


def parse_mime_type(mime_type: str):
    # Regular expression to extract key-value pairs from the mime type
    pattern = re.compile(r"(\w+)=([\w.]+)")
    params = dict(pattern.findall(mime_type))
    return params


@router.post("/upload-audio-segment/{session_id}/{segment_id}")
@inject
async def upload_audio_segment(
    active_user: Annotated[User, Depends(get_valid_user)],
    session_id: Annotated[str, Path(title="Session id of the audio segment")],
    segment_id: Annotated[str, Path(title="Id of the audio segment")],
    audio_data: UploadFile = File(...),
):
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
    with wave.open(str(pathlib.Path("data", f"{session_id}_{segment_id}.wav")), "wb") as wav_file:
        wav_file.setnchannels(channels)
        wav_file.setsampwidth(bits // 8)  # Convert bits to bytes per sample
        wav_file.setframerate(rate)
        wav_file.writeframes(audio_content)

    return {"message": "File uploaded successfully"}


@router.get("/status")
@inject
def get_status():
    return {"status": "OK"}


router.include_router(users.router)
