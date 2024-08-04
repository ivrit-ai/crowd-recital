from dependency_injector.wiring import Provide, inject
from dotenv import load_dotenv
from fastapi import FastAPI

from .containers import Container
from . import endpoints

load_dotenv()


def create_app() -> FastAPI:
    container = Container()

    container.config.db.connection_str.from_env("DB_CONNECTION_STR")

    db = container.db()
    db.create_database()

    app = FastAPI()
    app.container = container
    app.include_router(endpoints.router)
    return app


app = create_app()
