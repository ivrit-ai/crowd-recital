import logging
from typing import List

from environs import Env
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from containers import Container
from routers.api import api_app
from routers.web_client import get_web_client_app, get_web_client_env_app

env = Env()
env.read_env()


def setup_cors(app: FastAPI, origins: List[str]):
    # Configure CORS middleware
    app.add_middleware(
        CORSMiddleware,
        allow_origins=origins,
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )


def configure_logging(container):
    logging.basicConfig()
    if container.config.debug_mode():
        logging.getLogger("sqlalchemy.engine").setLevel(logging.INFO)


def create_app() -> FastAPI:
    container = Container()

    container.config.web_client_dist_folder.from_value(env("WEB_CLIENT_DIST_FOLDER", default="web_client_dist"))
    container.config.db.connection_str.from_value(env("DB_CONNECTION_STR"))
    container.config.cors.allow_origins.from_value(env.list("CORS_ALLOW_ORIGINS", []))
    container.config.auth.google.client_id.from_value(env("GOOGLE_CLIENT_ID"))
    container.config.auth.access_token_secret_key.from_value(env("ACCESS_TOKEN_SECRET_KEY"))
    container.config.debug_mode.from_value(env("DEBUG", default=False))

    configure_logging(container)

    db = container.db()
    db.create_database()

    app = FastAPI()

    setup_cors(app, container.config.cors.allow_origins())

    app.container = container
    app.mount("/api", api_app)  # Serves the backend api root
    app.mount("/env", get_web_client_env_app())  # Serves the web client dynamic configuration
    app.mount("/", get_web_client_app())  # Serves the web client root

    return app


app = create_app()
