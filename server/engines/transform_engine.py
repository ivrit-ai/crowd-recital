import json
import os
import subprocess
from pathlib import Path

from resource_access.recitals_ra import RecitalsRA


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


class TransformEngine:
    def __init__(self, recitals_ra: RecitalsRA, data_folder: str) -> None:
        self.recitals_ra = recitals_ra
        self.data_folder = data_folder

    def derive_session_audio(self, session_id: str, target_duration: float) -> str:
        recital_session = self.recitals_ra.get_by_id(session_id)
        source_audio_filename = Path(self.data_folder, recital_session.source_audio_filename)

        if not source_audio_filename or not os.path.isfile(source_audio_filename):
            print("Warning - Source audio file does not exist...", source_audio_filename)
            return None

        audio_info = get_audio_properties(source_audio_filename)

        output_audio_file_extension = "mka"  # Very generic - can take almost any encoding
        if audio_info is not None:
            if audio_info["codec_name"] == "vorbis":  # Place in a webm container
                output_audio_file_extension = "webm"

        main_output_audio_file = f"{session_id}.{output_audio_file_extension}"
        abs_main_output_audio_file = Path(self.data_folder, main_output_audio_file)

        base_ffmpeg_cmd = ["ffmpeg", "-y", "-i", str(source_audio_filename)]
        target_duration_ffmpeg_options = ["-t", str(target_duration)]

        main_ffmpeg_cmd = [
            *base_ffmpeg_cmd,
            "-acodec",
            "copy",
        ]

        # Append the target duration if it's specified (non-zero or non-None)
        if target_duration:
            main_ffmpeg_cmd.extend(target_duration_ffmpeg_options)

        # Output always at the end
        main_ffmpeg_cmd.append(str(abs_main_output_audio_file))

        light_output_audio_file = f"{session_id}.mp3"
        abs_light_output_audio_file = Path(self.data_folder, light_output_audio_file)
        light_ffmpeg_cmd = list(base_ffmpeg_cmd)

        # Append the target duration if it's specified (non-zero or non-None)
        if target_duration:
            light_ffmpeg_cmd.extend(target_duration_ffmpeg_options)
        # Output always at the end
        light_ffmpeg_cmd.append(str(abs_light_output_audio_file))

        try:
            subprocess.check_call(main_ffmpeg_cmd, stderr=subprocess.PIPE, stdout=subprocess.PIPE, text=True)
            subprocess.check_call(light_ffmpeg_cmd, stderr=subprocess.PIPE, stdout=subprocess.PIPE, text=True)
        except OSError as e:
            print("Warning - Error while transcoding audio input. Skipping.")
            print(e)
            return None

        return main_output_audio_file, light_output_audio_file
