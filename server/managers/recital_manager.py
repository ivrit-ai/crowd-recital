


from engines.aggregation_engine import AggregationEngine
from engines.transform_engine import TransformEngine
from errors import MissingSessionError
from models.recital_session import SessionStatus
from resource_access.recitals_content_ra import RecitalsContentRA
from resource_access.recitals_ra import RecitalsRA


class RecitalManager:
    def __init__(
        self,
        recitals_ra: RecitalsRA,
        recitals_content_ra: RecitalsContentRA,
        aggregation_engine: AggregationEngine,
        transform_engine: TransformEngine,
    ) -> None:
        self.recitals_ra = recitals_ra
        self.recitals_content_ra = recitals_content_ra
        self.aggregation_engine = aggregation_engine
        self.transform_engine = transform_engine

    def aggregate_ended_sessions(self) -> None:
        ended_sessions = self.recitals_ra.get_ended_sessions()

        if len(ended_sessions) == 0:
            print("No ended sessions found")

        for ended_session in ended_sessions:
            session_id = ended_session.id
            try:
                recital_session = self.recitals_ra.get_by_id(session_id)
                if not recital_session:
                    raise MissingSessionError()

                # Aggregate text
                vtt_file_content = self.aggregation_engine.aggregate_session_captions(recital_session.id)
                if vtt_file_content:
                    text_filename = f"{session_id}.vtt"
                    self.recitals_ra.store_session_text(vtt_file_content, text_filename)
                    recital_session.text_filename = text_filename
                    self.recitals_ra.upsert(recital_session)
                else:
                    print(f"No content found for session {session_id} - discarding")
                    recital_session.status = SessionStatus.DISCARDED
                    self.recitals_ra.upsert(recital_session)
                    return

                # Aggregate audio segments into a single file iif not done yet
                if not recital_session.source_audio_filename:
                    source_audio_filename = self.aggregation_engine.aggregate_session_audio(recital_session.id)
                    if not source_audio_filename:
                        print(f"No audio found for session {session_id} - discarding")
                        recital_session.status = SessionStatus.DISCARDED
                        self.recitals_ra.upsert(recital_session)
                        return

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
                        print(f"Could not transcode audio for session {session_id} - discarding")
                        recital_session.status = SessionStatus.DISCARDED

                    self.recitals_ra.upsert(recital_session)

            except Exception as e:
                print(f"Error aggregating session {session_id} - skipping")
                print(e)
                continue

    def upload_aggregated_sessions(self) -> None:
        aggregated_sessions = self.recitals_ra.get_aggregated_sessions()

        if len(aggregated_sessions) == 0:
            print("No aggregated sessions found")

        for aggregated_session in aggregated_sessions:
            session_id = aggregated_session.id
            try:
                recital_session = self.recitals_ra.get_by_id(session_id)
                if not recital_session:
                    raise MissingSessionError()

                text_filename = recital_session.text_filename
                source_audio_filename = recital_session.source_audio_filename
                audio_filename = recital_session.audio_filename
                light_audio_filename = recital_session.light_audio_filename

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

            except Exception as e:
                print(f"Error uploading session {session_id} - skipping")
                print(e)
                continue
