import os
from pathlib import Path

import boto3
from botocore.exceptions import ClientError


class RecitalsContentRA:

    def __init__(
        self,
        data_folder: str,
        content_s3_bucket: str,
    ) -> None:
        self.data_folder = data_folder
        self.content_s3_bucket = content_s3_bucket

        # Create the data folder if it does not exist
        Path(self.data_folder).mkdir(parents=True, exist_ok=True)

    def get_data_folder(self) -> str:
        return self.data_folder

    def upload_to_storage(self, source: str, target: str, metadata: dict[str, str], content_type: str = None) -> bool:
        if not self.content_s3_bucket:
            print("Warning S3 target bucket is not configured. Aborting.")
            return False

        # Check if the file exists
        if not os.path.isfile(source):
            print(f"Warning file {source} does not exist. Aborting.")
            return False

        # upload to S3
        s3 = boto3.client("s3")

        # ContentType - Should we include?
        try:
            extra_args = {"Metadata": metadata}
            if content_type:
                extra_args["ContentType"] = content_type

            s3.upload_file(source, self.content_s3_bucket, target, ExtraArgs=extra_args)
        except ClientError as e:
            print(e)
            return False
        return True

    def upload_text_to_storage(self, session_id: str, filename: str) -> bool:
        filename_in_data_folder = os.path.join(self.data_folder, filename)
        target_object_name = f"{session_id}/transcript.vtt"
        return self.upload_to_storage(filename_in_data_folder, target_object_name, metadata={"session": session_id})

    def _upload_audio_to_storage(
        self, session_id: str, filename: str, target_filename_prefix: str, content_type: str = None
    ) -> bool:
        filename_in_data_folder = Path(self.data_folder, filename)
        extension_of_file = os.path.splitext(filename)[1]
        target_object_name = f"{session_id}/{target_filename_prefix}.{extension_of_file}"
        return self.upload_to_storage(
            filename_in_data_folder, target_object_name, metadata={"session": session_id}, content_type=content_type
        )

    def upload_main_audio_to_storage(self, session_id: str, filename: str) -> bool:
        return self._upload_audio_to_storage(session_id, filename, "main.audio", {})

    def upload_source_audio_to_storage(self, session_id: str, filename: str) -> bool:
        return self._upload_audio_to_storage(session_id, filename, "source.audio", {})

    def upload_light_audio_to_storage(self, session_id: str, filename: str) -> bool:
        return self._upload_audio_to_storage(session_id, filename, "light.audio", content_type="audio/mp3")

    def remove_local_data_file(self, filename: str) -> None:
        filename_in_data_folder = Path(self.data_folder, filename)
        if filename_in_data_folder.exists():
            filename_in_data_folder.unlink()
