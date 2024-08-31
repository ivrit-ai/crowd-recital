import argparse
from enum import StrEnum

from dependency_injector.wiring import inject, Provide


from containers import Container
from configuration import configure
from utility.authentication import users
from models.database import Database
from managers.recital_manager import RecitalManager
from resource_access.users_ra import UsersRA
from models.user import UserGroups


class AdminCommands(StrEnum):
    AGGREGATE_SESSIONS = "aggregate_sessions"
    DROP_DB = "drop_db"
    CLEAR_DB = "clear_db"
    APPROVE_SPEAKER = "approve_speaker"


@inject
def aggregate_ended_sessions(recital_manager: RecitalManager = Provide(Container.recital_manager)):
    print("Aggregating ended sessions.")
    recital_manager.aggregate_ended_sessions()


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
    elif command == AdminCommands.DROP_DB:
        drop_database(parser)
    elif command == AdminCommands.CLEAR_DB:
        clear_database(parser)
    elif command == AdminCommands.APPROVE_SPEAKER:
        approve_speaker(parser)
    else:
        raise Exception(f"Unknown command: {command}")


if __name__ == "__main__":
    parser = argparse.ArgumentParser(prog="admin_client.py", description="Crowd Recital Admin Client")

    # Based on the main command - decide what to run
    parser.add_argument("command", type=str, choices=[cmd for cmd in AdminCommands], help="Command to run")
    parser.add_argument("--speaker-email", type=str, help="Email of the speaker to approve", default=None)
    parser.add_argument("-y", action="store_true", help="Skips confirmation prompts with a y response", default=False)

    # Validate the command
    command = parser.parse_args().command
    if command not in [cmd for cmd in AdminCommands]:
        raise Exception(f"Unknown command: {command}")

    try:
        run_command(command, parser)
    except Exception as e:
        print(f"Error: {e}")
        print(parser.format_usage())
