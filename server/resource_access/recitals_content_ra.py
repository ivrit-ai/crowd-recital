from datetime import datetime, timedelta
from contextlib import AbstractContextManager
import os
from typing import Callable, Iterator

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

    def upload_to_storage(self, source: str, target: str, metadata: dict[str, str]) -> bool:
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
            s3.upload_file(
                source,
                self.content_s3_bucket,
                target,
                ExtraArgs={"Metadata": metadata},
            )
        except ClientError as e:
            print(e)
            return False
        return True

    def upload_text_to_storage(self, session_id: str, filename: str) -> bool:
        filename_in_data_folder = os.path.join(self.data_folder, filename)
        target_object_name = f"{session_id}/transcript.vtt"
        return self.upload_to_storage(filename_in_data_folder, target_object_name, metadata={"session": session_id})

    def upload_audio_to_storage(self, session_id: str, filename: str) -> bool:
        filename_in_data_folder = os.path.join(self.data_folder, filename)
        extension_of_file = os.path.splitext(filename)[1]
        target_object_name = f"{session_id}/audio.{extension_of_file}"
        return self.upload_to_storage(filename_in_data_folder, target_object_name, metadata={"session": session_id})
