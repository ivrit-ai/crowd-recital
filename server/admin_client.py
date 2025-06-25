import argparse
import asyncio
import os
import tempfile
import mimetypes
from enum import StrEnum
from urllib.parse import urlparse

import requests
from dependency_injector.wiring import Provide, inject

from configuration import configure
from containers import Container
from engines.extraction_engine import SUPPORTED_DOC_LANGS
from managers.document_manager import DocumentManager
from managers.recital_manager import RecitalManager
from models.database import Database
from models.text_document import FILE_UPLOAD_SOURCE_TYPE
from models.user import UserGroups
from resource_access.users_ra import UsersRA
from utility.authentication import users


class AdminCommands(StrEnum):
    AGGREGATE_SESSIONS = "aggregate_sessions"
    UPLOAD_SESSIONS = "upload_sessions"
    DROP_DB = "drop_db"
    CLEAR_DB = "clear_db"
    APPROVE_SPEAKER = "approve_speaker"
    UPLOAD_DOCUMENT = "upload_document"


@inject
def aggregate_ended_sessions(recital_manager: RecitalManager = Provide(Container.recital_manager)):
    print("Aggregating ended sessions.")
    recital_manager.aggregate_ended_sessions()
    print("Done.")


@inject
def upload_aggregated_sessions(recital_manager: RecitalManager = Provide(Container.recital_manager)):
    print("Uploading aggregated sessions.")
    recital_manager.upload_aggregated_sessions()
    print("Done.")


@inject
def clear_database(parser: argparse.ArgumentParser, db: Database = Provide(Container.db)):
    # Warn the user - get explicit permission to drop-create the DB
    if not parser.parse_args().y:
        print("WARNING: This will clear all the tables in the database.")
        print("Are you sure you want to continue? (y/n)")
        answer = input()
        if answer != "y":
            print("Aborting.")
            return

    print("Clearing database.")
    db.clear_database()


@inject
def approve_speaker(parser: argparse.ArgumentParser, users_ra: UsersRA = Provide(Container.users_ra)):
    speaker_email = parser.parse_args().speaker_email

    if not speaker_email:
        raise Exception("Speaker email is required.")

    user = users_ra.get_by_email(speaker_email)
    if not user:
        user = users.create_empty_speaker_user(speaker_email)
    else:
        user.group = UserGroups.SPEAKER

    users_ra.upsert(user)

    print(f"Speaker {speaker_email} approved.")


async def upload_document_async(
    parser: argparse.ArgumentParser,
    document_manager: DocumentManager,
    users_ra: UsersRA,
):
    args = parser.parse_args()

    # Validate required arguments
    if not args.source_type:
        raise Exception("Source type is required (--source-type)")

    if args.source_type != FILE_UPLOAD_SOURCE_TYPE:
        raise Exception(f"Invalid source type: {args.source_type}. Only {FILE_UPLOAD_SOURCE_TYPE} is supported.")

    if not args.source_path:
        raise Exception("Source path is required (--source-path)")

    if not args.source_lang:
        raise Exception("Source language is required (--source-lang)")

    if args.source_lang not in SUPPORTED_DOC_LANGS:
        raise Exception(
            f"Invalid source language: {args.source_lang}. Supported languages: {', '.join(SUPPORTED_DOC_LANGS)}"
        )

    # Get the owner user
    owner = None
    if args.owner_email:
        owner = users_ra.get_by_email(args.owner_email)
        if not owner:
            raise Exception(f"User with email {args.owner_email} not found")

    # Check if the source is a URL or a local file
    is_url = args.source_path.startswith("http://") or args.source_path.startswith("https://")
    temp_file = None
    source_filename = None

    try:
        if is_url:
            # Download the file to a temporary location
            print(f"Downloading file from {args.source_path}...")

            # Get the filename from the URL
            parsed_url = urlparse(args.source_path)
            source_filename = os.path.basename(parsed_url.path)
            if not source_filename:
                source_filename = "downloaded_file"

            # Create a temporary file
            temp_file = tempfile.NamedTemporaryFile(delete=False)

            # Download the file
            response = requests.get(args.source_path, stream=True)
            response.raise_for_status()  # Raise an exception for HTTP errors

            # Write the content to the temporary file
            for chunk in response.iter_content(chunk_size=8192):
                temp_file.write(chunk)

            temp_file.close()

            # Open the file in binary mode for reading
            source_file = open(temp_file.name, "rb")

            # Determine the content type
            content_type, _ = mimetypes.guess_type(source_filename)
            if not content_type:
                content_type = "text/html"

            print(f"File downloaded to temporary location: {temp_file.name}")
        else:
            # Use the local file
            if not os.path.exists(args.source_path):
                raise Exception(f"File not found: {args.source_path}")

            source_filename = os.path.basename(args.source_path)
            source_file = open(args.source_path, "rb")

            # Determine the content type
            content_type, _ = mimetypes.guess_type(args.source_path)
            if not content_type:
                content_type = "text/plain"

        # Create the document
        print(f"Creating document from source file: {source_filename} - assumed mime type: {content_type}")
        document = await document_manager.create_from_source_file(
            source_file=source_file,
            source_content_type=content_type,
            source_filename=source_filename,
            title=args.title,
            lang=args.source_lang,
            owner=owner,
        )

        source_file.close()

        print(f"Document created successfully with ID: {document.id}")
        print(f"Title: {document.title}")
        print(f"Language: {document.lang}")

    finally:
        # Clean up the temporary file if it exists
        if temp_file and os.path.exists(temp_file.name):
            os.unlink(temp_file.name)
            print(f"Temporary file deleted: {temp_file.name}")


@inject
def upload_document(
    parser: argparse.ArgumentParser,
    document_manager: DocumentManager = Provide(Container.document_manager),
    users_ra: UsersRA = Provide(Container.users_ra),
):
    """Wrapper function to run the async upload_document_async function"""
    asyncio.run(upload_document_async(parser, document_manager, users_ra))


def drop_database(parser: argparse.ArgumentParser, db: Database = Provide(Container.db)):
    # Warn the user - get explicit permission to drop-create the DB
    if not parser.parse_args().y:
        print("WARNING: This will drop all the tables in the database.")
        print("Are you sure you want to continue? (y/n)")
        answer = input()
        if answer != "y":
            print("Aborting.")
            return

    print("Dropping database.")
    db.drop_database()


def run_command(command: str, parser: argparse.ArgumentParser):
    container = configure(Container())

    db = container.db()
    db.create_database()

    container.wire(modules=[__name__])

    if command == AdminCommands.AGGREGATE_SESSIONS:
        aggregate_ended_sessions()
    elif command == AdminCommands.UPLOAD_SESSIONS:
        upload_aggregated_sessions()
    elif command == AdminCommands.DROP_DB:
        drop_database(parser)
    elif command == AdminCommands.CLEAR_DB:
        clear_database(parser)
    elif command == AdminCommands.APPROVE_SPEAKER:
        approve_speaker(parser)
    elif command == AdminCommands.UPLOAD_DOCUMENT:
        upload_document(parser)
    else:
        raise Exception(f"Unknown command: {command}")


if __name__ == "__main__":
    parser = argparse.ArgumentParser(prog="admin_client.py", description="Crowd Recital Admin Client")

    # Based on the main command - decide what to run
    parser.add_argument("command", type=str, choices=[str(cmd) for cmd in AdminCommands], help="Command to run")
    parser.add_argument("--speaker-email", type=str, help="Email of the speaker to approve", default=None)
    parser.add_argument("-y", action="store_true", help="Skips confirmation prompts with a y response", default=False)

    # Arguments for upload_document command
    parser.add_argument(
        "--owner-email",
        type=str,
        help="Email of the user who will own the document - If unspecified, The document will not be owned",
        default=None,
    )
    parser.add_argument("--source-type", type=str, help="Source type of the document", default=None)
    parser.add_argument("--source-path", type=str, help="Path to the source file or URL", default=None)
    parser.add_argument("--source-lang", type=str, help="Language of the source (he or yi)", default=None)
    parser.add_argument("--title", type=str, help="Title of the document", default=None)

    # Validate the command
    command = parser.parse_args().command
    if command not in [cmd for cmd in AdminCommands]:
        raise Exception(f"Unknown command: {command}")

    try:
        run_command(command, parser)
    except Exception as e:
        print(f"Error: {e}")
        print(parser.format_usage())
