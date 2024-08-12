from typing import List

from environs import Env
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from .containers import Container
from .routers import api

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
    container = Container()

    container.config.db.connection_str.from_value(env("DB_CONNECTION_STR"))
    container.config.cors.allow_origins.from_value(env.list("CORS_ALLOW_ORIGINS", []))
    container.config.auth.google.client_id.from_value(env("GOOGLE_CLIENT_ID"))
    container.config.auth.access_token_secret_key.from_value(env("ACCESS_TOKEN_SECRET_KEY"))

    db = container.db()
    db.create_database()

    app = FastAPI()

    setup_cors(app, container.config.cors.allow_origins())

    app.container = container
    app.include_router(api.router, prefix="/api")
    return app


app = create_app()
