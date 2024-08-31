from typing import List

from environs import Env
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from configuration import configure
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


def create_app() -> FastAPI:
    container = configure(Container())

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
