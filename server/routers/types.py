from pydantic import BaseModel


class SessionPreview(BaseModel):
    id: str
    audio_url: str
    transcript_url: str
