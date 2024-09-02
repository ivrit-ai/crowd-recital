from contextlib import AbstractContextManager
from datetime import datetime, timedelta
from typing import Callable, Iterator

from sqlmodel import Session, and_, or_, select

from models.recital_audio_segment import RecitalAudioSegment
from models.recital_session import RecitalSession, SessionStatus
from models.recital_text_segment import RecitalTextSegment


class RecitalsRA:

    def __init__(
        self,
        session_factory: Callable[..., AbstractContextManager[Session]],
        data_folder: str,
    ) -> None:
        self.session_factory = session_factory
        self.data_folder = data_folder

    def get_by_id(self, recital_session_id: str) -> RecitalSession | None:
        with self.session_factory() as session:
            results = session.exec(select(RecitalSession).filter(RecitalSession.id == recital_session_id))
            return results.first()

    # More secure - to be used for authenticated API calls
    def get_by_id_and_user_id(self, recital_session_id: str, user_id: str) -> RecitalSession | None:
        with self.session_factory() as session:
            results = session.exec(
                select(RecitalSession).filter(
                    RecitalSession.id == recital_session_id, RecitalSession.user_id == user_id
                )
            )
            return results.first()

    def get_ended_sessions(self, limit: int = 100, consider_abandoned_after_hours: int = 2) -> Iterator[RecitalSession]:
        with self.session_factory() as session:
            cutoff_consider_active_as_ended = datetime.now() - timedelta(hours=consider_abandoned_after_hours)
            results = session.exec(
                select(RecitalSession)
                .filter(
                    or_(
                        # Either it was marked as ended
                        RecitalSession.status == SessionStatus.ENDED,
                        # Or seemingly abandoned - but may have some content to use
                        and_(
                            RecitalSession.status == SessionStatus.ACTIVE,
                            RecitalSession.created_at < cutoff_consider_active_as_ended,
                        ),
                    )
                )
                .limit(limit)
            )
            return results.all()

    def get_aggregated_sessions(self, limit: int = 100) -> Iterator[RecitalSession]:
        with self.session_factory() as session:
            results = session.exec(
                select(RecitalSession)
                .filter(
                    RecitalSession.status == SessionStatus.AGGREGATED,
                )
                .limit(limit)
            )
            return results.all()

    def add_text_segment(self, recital_text_segment: RecitalTextSegment):
        with self.session_factory() as session:
            session.add(recital_text_segment)
            session.commit()
            session.refresh(recital_text_segment)

    def get_session_text_segments(self, recital_session_id: str) -> Iterator[RecitalTextSegment]:
        with self.session_factory() as session:
            results = session.exec(
                select(RecitalTextSegment).filter(RecitalTextSegment.recital_session_id == recital_session_id)
                # Sort results by the "seek_end" column ascending
                .order_by(RecitalTextSegment.seek_end)
            )
            return results.all()

    def add_audio_segment(self, recital_audio_segment: RecitalAudioSegment):
        with self.session_factory() as session:
            session.add(recital_audio_segment)
            session.commit()
            session.refresh(recital_audio_segment)

    def get_audio_segments(self, recital_session_id: str) -> Iterator[RecitalAudioSegment]:
        with self.session_factory() as session:
            results = session.exec(
                select(RecitalAudioSegment).filter(RecitalAudioSegment.recital_session_id == recital_session_id)
                # Sort results by the sequential column ascending
                .order_by(RecitalAudioSegment.sequential)
            )
            return results.all()

    def upsert(self, recital_session: RecitalSession) -> None:
        with self.session_factory() as session:
            session.merge(recital_session)
            session.commit()
            return recital_session

    def store_session_text(self, text_content: str, filename: str) -> str:
        with open(f"{self.data_folder}/{filename}", "w") as f:
            f.write(text_content)
