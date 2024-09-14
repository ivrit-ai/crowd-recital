import json
import os
import re
import shutil
import subprocess
from pathlib import Path
from time import gmtime, strftime

from webvtt import Caption, WebVTT

from models.recital_text_segment import RecitalTextSegment
from resource_access.recitals_ra import RecitalsRA


def normalize_text_as_caption_text(text: str) -> str:
    return re.sub(r"\s+", " ", text)


def create_caption(text: str, start: float, end: float) -> Caption:
    return Caption(
        # Format to hh:mm:ss.zzz
        start=strftime("%H:%M:%S.000", gmtime(start)),
        end=strftime("%H:%M:%S.000", gmtime(end)),
        text=normalize_text_as_caption_text(text),
    )


def parse_audio_info(audio_info):
    if audio_info is not None and "streams" in audio_info:
        for stream in audio_info["streams"]:
            if stream["codec_type"] == "audio":
                codec_name = str(stream["codec_name"])
                channels = int(stream["channels"])
                return {"channels": channels, "codec_name": codec_name}
    return None


def get_audio_properties(input_file):
    # Check if the file exists
    if not os.path.isfile(input_file):
        print("Warning - Input audio file does not exist...", input_file)
        return None

    # Run ffprobe to get audio properties in JSON format
    cmd = ["ffprobe", "-v", "error", "-print_format", "json", "-show_streams", "-select_streams", "a", input_file]
    result = subprocess.run(cmd, stderr=subprocess.PIPE, stdout=subprocess.PIPE, text=True)
    output = result.stdout

    # Parse the JSON output
    info = None
    try:
        raw_info = json.loads(output)
        info = parse_audio_info(raw_info)
    except:
        print("Warning - Unable to probe input audio source properties...")
        pass

    return info


class AggregationEngine:
    def __init__(self, recitals_ra: RecitalsRA, data_folder: str) -> None:
        self.recitals_ra = recitals_ra
        self.data_folder = data_folder

    def aggregate_session_captions(self, session_id: str, format: str = "vtt") -> str:
        if not format == "vtt":
            raise ValueError("Only `vtt` format is supported")

        vtt = WebVTT()

        vtt.header_comments.append("IVRIT.AI Recital Session Captions")
        vtt.header_comments.append(f"Session ID: {session_id}")

        prev_seek = 0
        for text_segment in self.recitals_ra.get_session_text_segments(session_id):
            text_segment: RecitalTextSegment = text_segment
            vtt.captions.append(
                create_caption(
                    text_segment.text,
                    prev_seek,
                    text_segment.seek_end,
                )
            )
            prev_seek = text_segment.seek_end

        if prev_seek == 0:
            return None

        return vtt.content

    def _get_audio_segment_file_names(self, session_id: str) -> list[str]:
        audio_segments = self.recitals_ra.get_audio_segments(session_id)
        maybe_audio_segments_filenames = [segment.filename for segment in audio_segments]

        # Check the existence of the segment file names.
        # Keep the ones we can find
        return [f for f in maybe_audio_segments_filenames if Path(self.data_folder, f).exists()]

    def _delete_audio_segment_file_names(self, file_names: list[str]) -> None:
        for seg_filename in file_names:
            os.remove(Path(self.data_folder, seg_filename))

    def delete_session_audio(self, session_id: str) -> None:
        audio_segments_filenames = self._get_audio_segment_file_names(session_id)
        self._delete_audio_segment_file_names(audio_segments_filenames)

    def aggregate_session_audio(self, session_id: str) -> str:
        audio_segments_filenames = self._get_audio_segment_file_names(session_id)

        if len(audio_segments_filenames) == 0:
            return None

        first_audio_segment_filename = audio_segments_filenames[0]

        # Get the base file name that will represent concatenated segments data
        concatenated_filename = re.sub(r"\.seg\..*", "", first_audio_segment_filename)

        # Concat all segments into a single file
        with open(Path(self.data_folder, concatenated_filename), "wb") as concat_file:
            for seg_filename in audio_segments_filenames:
                with open(Path(self.data_folder, seg_filename), "rb") as seg_file:
                    shutil.copyfileobj(seg_file, concat_file)

        # Delete all segments files - now they are stored into a single file
        self._delete_audio_segment_file_names(audio_segments_filenames)

        return concatenated_filename
