from datetime import datetime, timedelta, timezone

from apscheduler.triggers.combining import OrTrigger
from apscheduler.triggers.date import DateTrigger
from apscheduler.triggers.interval import IntervalTrigger
from pydantic import BaseModel

from engines.aggregation_engine import AggregationEngine
from engines.transform_engine import TransformEngine
from errors import MissingSessionError
from models.recital_session import SessionStatus
from models.recital_text_segment import RecitalTextSegment
from models.user import User
from resource_access.recitals_content_ra import RecitalsContentRA
from resource_access.recitals_ra import RecitalsRA
from utility.analytics.posthog import ConfiguredPosthog
from utility.scheduler import JobScheduler
from utility.cache import stats as stats_cache


class TextSegmentRequestBody(BaseModel):
    seek_end: float
    text: str


class RecitalManager:
    def __init__(
        self,
        session_finalization_job_disabled: bool,
        session_finalization_job_interval: int,
        disable_s3_upload: bool,
        posthog: ConfiguredPosthog,
        job_scheduler: JobScheduler,
        recitals_ra: RecitalsRA,
        recitals_content_ra: RecitalsContentRA,
        aggregation_engine: AggregationEngine,
        transform_engine: TransformEngine,
    ) -> None:
        self.session_finalization_job_disabled = session_finalization_job_disabled
        self.session_finalization_job_interval = session_finalization_job_interval
        self.disable_s3_upload = disable_s3_upload
        self.posthog = posthog
        self.job_scheduler = job_scheduler
        self.session_finalization_job_id = "session_finalization_job"
        self.recitals_ra = recitals_ra
        self.recitals_content_ra = recitals_content_ra
        self.aggregation_engine = aggregation_engine
        self.transform_engine = transform_engine

    def schedule_session_finalization_job(self, defer=False) -> None:
        if self.session_finalization_job_disabled:
            return

        # Run now, and every specified internal
        # If the job exists - reschedule it
        run_soon_at = DateTrigger(run_date=datetime.now(timezone.utc) + timedelta(seconds=2))
        run_every = IntervalTrigger(seconds=self.session_finalization_job_interval)
        now_and_onward = OrTrigger([run_soon_at, run_every])
        trigger = run_every if defer else now_and_onward
        self.job_scheduler.add_job(
            self._session_finalization_task,
            id=self.session_finalization_job_id,
            replace_existing=True,
            trigger=trigger,
        )

    def schedule_session_duration_update_job(self, session_id: str, duration: float) -> None:
        self.job_scheduler.add_job(
            self._session_duration_update_task,
            trigger=None,
            kwargs=dict(session_id=session_id, duration=duration),
            id=f"session_duration_update_{session_id}",  # Runs serially per each session id,
            replace_existing=False,
            # Up to N seconds is ok to run this job as soon as the prev one is done
            misfire_grace_time=15,
        )

    def _session_finalization_task(self) -> None:
        self.aggregate_ended_sessions()
        self.upload_aggregated_sessions()
        self.discard_disavowed_sessions()

    def _session_duration_update_task(self, session_id: str, duration: float) -> None:
        recital_session = self.recitals_ra.get_by_id(session_id)
        if not recital_session:
            return

        # Update duration
        recital_session.duration = max(recital_session.duration or 0, duration)
        self.recitals_ra.upsert(recital_session)

    def aggregate_ended_sessions(self) -> None:
        ended_sessions = self.recitals_ra.get_ended_sessions()

        if len(ended_sessions) == 0:
            return

        for ended_session in ended_sessions:
            session_id = ended_session.id
            try:
                recital_session = self.recitals_ra.get_by_id(session_id)
                if not recital_session:
                    raise MissingSessionError()

                # Aggregate text
                if not recital_session.text_filename:
                    vtt_file_content = self.aggregation_engine.aggregate_session_captions(recital_session.id)
                    if vtt_file_content:
                        text_filename = f"{session_id}.vtt"
                        self.recitals_ra.store_session_text(vtt_file_content, text_filename)
                        recital_session.text_filename = text_filename
                        self.recitals_ra.upsert(recital_session)
                    else:
                        print(f"No textual content found for session {session_id} - disavowing")
                        recital_session.disavowed = True
                        self.recitals_ra.upsert(recital_session)
                        continue

                # Aggregate audio segments into a single file if not done yet
                if not recital_session.source_audio_filename:
                    source_audio_filename = self.aggregation_engine.aggregate_session_audio(recital_session.id)
                    if not source_audio_filename:
                        print(f"No audio found for session {session_id} - disavowing")
                        recital_session.disavowed = True
                        self.recitals_ra.upsert(recital_session)
                        continue

                    recital_session.source_audio_filename = source_audio_filename
                    self.recitals_ra.upsert(recital_session)

                # Transcode the audio into the target formats if not done yet
                if not recital_session.main_audio_filename:
                    main_audio_filename, light_audio_filename = self.transform_engine.transcode_session_audio(
                        recital_session.id
                    )

                    if main_audio_filename:
                        recital_session.light_audio_filename = light_audio_filename
                        recital_session.main_audio_filename = main_audio_filename
                        recital_session.status = SessionStatus.AGGREGATED  # done aggregating
                    else:
                        print(f"Could not transcode audio for session {session_id} - skipping")
                        self.posthog.capture(
                            "server",
                            "Session Aggregation Transcode Failed",
                            {
                                "session_id": session_id,
                            },
                        )
                        continue

                    self.recitals_ra.upsert(recital_session)

                    self.posthog.capture(
                        "server",
                        "Session Aggregation Done",
                        {
                            "source": "server",
                            "session_id": session_id,
                            "duration": recital_session.duration,
                        },
                    )

            except Exception as e:
                print(f"Error aggregating session {session_id} - skipping")
                print(e)
                continue

    def upload_aggregated_sessions(self) -> None:
        aggregated_sessions = self.recitals_ra.get_aggregated_sessions()

        if len(aggregated_sessions) == 0:
            return

        uploaded_sessions_mutated = False

        for aggregated_session in aggregated_sessions:
            session_id = aggregated_session.id
            try:
                recital_session = self.recitals_ra.get_by_id(session_id)
                if not recital_session:
                    raise MissingSessionError()

                text_filename = recital_session.text_filename
                source_audio_filename = recital_session.source_audio_filename
                audio_filename = recital_session.main_audio_filename
                light_audio_filename = recital_session.light_audio_filename

                if not self.disable_s3_upload:
                    # Upload the files to the content storage
                    if not self.recitals_content_ra.upload_text_to_storage(session_id, text_filename):
                        raise Exception("Error uploading session text to storage")
                    if not self.recitals_content_ra.upload_main_audio_to_storage(session_id, audio_filename):
                        raise Exception("Error uploading session audio to storage")
                    if not self.recitals_content_ra.upload_source_audio_to_storage(session_id, source_audio_filename):
                        raise Exception("Error uploading session source audio to storage")
                    if not self.recitals_content_ra.upload_light_audio_to_storage(session_id, light_audio_filename):
                        raise Exception("Error uploading session source audio to storage")

                    # Delete the source files after they were uploaded
                    self.recitals_content_ra.remove_local_data_file(text_filename)
                    self.recitals_content_ra.remove_local_data_file(audio_filename)
                    self.recitals_content_ra.remove_local_data_file(source_audio_filename)
                    self.recitals_content_ra.remove_local_data_file(light_audio_filename)

                # Mark the session as published
                recital_session.status = SessionStatus.UPLOADED
                self.recitals_ra.upsert(recital_session)
                uploaded_sessions_mutated = True

                # Invalidate the stats cache for this user
                stats_cache.invalidate_stats_by_user_id(recital_session.user_id)

                self.posthog.capture(
                    "server",
                    "Session Upload Done",
                    {
                        "source": "server",
                        "session_id": session_id,
                        "duration": recital_session.duration,
                    },
                )

            except Exception as e:
                print(f"Error uploading session {session_id} - skipping")
                print(e)
                continue

        if uploaded_sessions_mutated:
            stats_cache.invalidate_cross_user_stats()

    def discard_disavowed_sessions(self) -> None:
        disavowed_sessions = self.recitals_ra.get_disavowed_pending_sessions()

        if len(disavowed_sessions) == 0:
            return

        discarded_sessions_mutated = False
        for disavowed_session in disavowed_sessions:
            session_id = disavowed_session.id

            if self.discard_session(session_id):
                discarded_sessions_mutated = True

        if discarded_sessions_mutated:
            stats_cache.invalidate_cross_user_stats()

    def discard_session(self, session_id: str) -> bool:
        try:
            recital_session = self.recitals_ra.get_by_id(session_id)
            if not recital_session:
                raise MissingSessionError()

            # If already discarded - nothing to do
            if recital_session.status == SessionStatus.DISCARDED:
                return False

            original_status = recital_session.status
            recital_session.status = SessionStatus.DISCARDED
            recital_session.duration = 0
            # This will try to ensure no new content is added for this session moving forward
            self.recitals_ra.upsert(recital_session)

            # Invalidate the stats cache for this user
            stats_cache.invalidate_stats_by_user_id(recital_session.user_id)

            if original_status in [SessionStatus.ACTIVE, SessionStatus.ENDED]:
                # delete audio segment files which may have been uploaded (but not yet aggregated)
                self.aggregation_engine.delete_session_audio(session_id)
                # In case audio aggregation failed and the session is not yet marked as aggregated
                if recital_session.text_filename:
                    self.recitals_content_ra.remove_local_data_file(recital_session.text_filename)

            if original_status in [SessionStatus.AGGREGATED, SessionStatus.UPLOADED]:
                # Delete local files which may have already been deleted after upload
                text_filename = recital_session.text_filename
                source_audio_filename = recital_session.source_audio_filename
                audio_filename = recital_session.main_audio_filename
                light_audio_filename = recital_session.light_audio_filename

                # Delete the local files
                if text_filename:
                    self.recitals_content_ra.remove_local_data_file(text_filename)
                if source_audio_filename:
                    self.recitals_content_ra.remove_local_data_file(source_audio_filename)
                if light_audio_filename:
                    self.recitals_content_ra.remove_local_data_file(light_audio_filename)
                if audio_filename:
                    self.recitals_content_ra.remove_local_data_file(audio_filename)

            if original_status == SessionStatus.UPLOADED:
                # Delete remote files which might have been created during upload
                if not self.recitals_content_ra.delete_session_content_from_storage(session_id):
                    print(f"Error deleting session {session_id} content from storage")
                    self.posthog.capture(
                        "server",
                        "error deleting session content from storage",
                        {
                            "source": "server",
                            "$process_person_profile": False,
                            "session_id": session_id,
                        },
                    )

        except:
            print(f"Error deleting session {session_id} content")
            self.posthog.capture(
                "server",
                "error deleting session content",
                {
                    "session_id": session_id,
                },
            )

        return True

    def add_text_segment(self, session_id: str, user: User, segment: TextSegmentRequestBody) -> None:
        recital_session = self.recitals_ra.get_by_id_and_user_id(session_id, user.id)
        if not recital_session or recital_session.disavowed:
            raise MissingSessionError()

        text_segment = RecitalTextSegment(recital_session=recital_session, seek_end=segment.seek_end, text=segment.text)
        self.recitals_ra.add_text_segment(text_segment)

        self.schedule_session_duration_update_job(session_id, segment.seek_end)
