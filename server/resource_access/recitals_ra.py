from contextlib import AbstractContextManager
from typing import Callable, Iterator

from sqlmodel import Session, select

from ..models.recital_session import RecitalSession
from ..models.recital_text_segment import RecitalTextSegment
from ..models.recital_audio_segment import RecitalAudioSegment


class RecitalsRA:

    def __init__(self, session_factory: Callable[..., AbstractContextManager[Session]]) -> None:
        self.session_factory = session_factory

    def get_by_id_and_user_id(self, recital_session_id: str, user_id: str) -> RecitalSession | None:
        with self.session_factory() as session:
            results = session.exec(
                select(RecitalSession).filter(
                    RecitalSession.id == recital_session_id, RecitalSession.user_id == user_id
                )
            )
            return results.one()

    def add_text_segment(self, recital_text_segment: RecitalTextSegment):
        with self.session_factory() as session:
            session.add(recital_text_segment)
            session.commit()
            session.refresh(recital_text_segment)

    def add_audio_segment(self, recital_audio_segment: RecitalAudioSegment):
        with self.session_factory() as session:
            session.add(recital_audio_segment)
            session.commit()
            session.refresh(recital_audio_segment)

    def upsert(self, recital_session: RecitalSession) -> None:
        with self.session_factory() as session:
            session.merge(recital_session)
            session.commit()
            return recital_session
