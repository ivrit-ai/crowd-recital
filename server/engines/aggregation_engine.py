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
from models.recital_session import RecitalSession
from models.recital_text_segment import RecitalTextSegment
from resource_access.recitals_ra import RecitalsRA
from resource_access.documents_ra import DocumentsRA


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

    def aggregate_session_audio(self, session_id: str) -> str:
        audio_segments = self.recitals_ra.get_audio_segments(session_id)
        maybe_audio_segments_filenames = [Path(self.data_folder, segment.filename) for segment in audio_segments]

        # Check the existence of the segment file names.
        # Keep the ones we can find
        audio_segments_filenames = [f for f in maybe_audio_segments_filenames if f.exists()]

        if len(audio_segments_filenames) == 0:
            return None

        # The first segment contains the container header
        # This has enough info to detect the codec
        audio_info = get_audio_properties(audio_segments_filenames[0])

        output_audio_file_extension = "mka"  # Very generic - can take almost any encoding
        if audio_info is not None:
            if audio_info["codec_name"] == "vorbis":  # Place in a webm container
                output_audio_file_extension = "webm"

        output_audio_file = f"{session_id}.{output_audio_file_extension}"
        abs_output_audio_file = Path(self.data_folder, output_audio_file)

        cat_cmd = ["cat"] + [str(f) for f in audio_segments_filenames]
        ffmpeg_cmd = [
            "ffmpeg",
            "-y",
            "-i",
            "pipe:0",
            "-acodec",
            "copy",
            str(abs_output_audio_file),
        ]

        try:
            # Concat all files into a single stream to feed into ffmpeg
            cat_proc = subprocess.Popen(cat_cmd, stdout=subprocess.PIPE)
        except OSError as e:
            print("Warning - Error while Reading input segment files. Skipping.")
            print(e)
            return None

        try:
            ffmpeg_proc = subprocess.Popen(
                ffmpeg_cmd, stdin=cat_proc.stdout, stderr=subprocess.PIPE, stdout=subprocess.PIPE, text=True
            )
        except OSError as e:
            print("Warning - Error while concatenating input segment files. Skipping.")
            print(e)
            return None

        # Close the output of the first process to signal that we're done writing to it
        cat_proc.stdout.close()

        # Wait for ffmpeg to finish
        result = ffmpeg_proc.communicate()

        # Check for errors
        if ffmpeg_proc.returncode != 0:
            print(f"FFMPEG error reported: {result[1]}")
            return None

        return output_audio_file
