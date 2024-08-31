import json
import os
from pathlib import Path
import re
import subprocess
from time import gmtime, strftime
from typing import Optional
from uuid import UUID


from dependency_injector.wiring import Provide, inject
from fastapi.exceptions import HTTPException
from webvtt import WebVTT, Caption

from errors import MissingSessionError
from models.user import User
from models.recital_session import SessionStatus
from models.recital_text_segment import RecitalTextSegment
from resource_access.recitals_ra import RecitalsRA
from resource_access.documents_ra import DocumentsRA
from engines.aggregation_engine import AggregationEngine


class RecitalManager:
    def __init__(self, recitals_ra: RecitalsRA, aggregation_engine: AggregationEngine) -> None:
        self.recitals_ra = recitals_ra
        self.aggregation_engine = aggregation_engine

    def aggregate_ended_sessions(self) -> None:
        ended_sessions = self.recitals_ra.get_ended_sessions()

        if len(ended_sessions) == 0:
            print("No ended sessions found")

        for ended_session in ended_sessions:
            session_id = ended_session.id
            try:
                has_content = False
                recital_session = self.recitals_ra.get_by_id(session_id)
                if not recital_session:
                    raise MissingSessionError()

                vtt_file_content = self.aggregation_engine.aggregate_session_captions(recital_session.id)
                if vtt_file_content:
                    text_filename = f"{session_id}.vtt"
                    self.recitals_ra.store_session_text(vtt_file_content, text_filename)

                    audio_filename = self.aggregation_engine.aggregate_session_audio(recital_session.id)

                    if audio_filename:
                        recital_session.status = SessionStatus.AGGREGATED
                        recital_session.audio_filename = audio_filename
                        recital_session.text_filename = text_filename
                        has_content = True
                        print(f"Done aggregating session {session_id}")

                if not has_content:
                    print(f"No content found for session {session_id} - discarding")
                    recital_session.status = SessionStatus.DISCARDED

                self.recitals_ra.upsert(recital_session)

            except Exception as e:
                print(f"Error aggregating session {session_id} - skipping")
                print(e)
                continue
