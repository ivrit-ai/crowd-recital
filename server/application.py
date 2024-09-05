from contextlib import asynccontextmanager
from typing import List

from dependency_injector.wiring import Provide, inject
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from configuration import configure
from containers import Container
from routers.api import api_app
from routers.web_client import get_web_client_app, get_web_client_env_app
from utility.scheduler import JobScheduler


def setup_cors(app: FastAPI, origins: List[str]):
    # Configure CORS middleware
    app.add_middleware(
        CORSMiddleware,
        allow_origins=origins,
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )


@asynccontextmanager
@inject
async def lifespan(app: FastAPI, job_scheduler: JobScheduler = Provide[Container.job_scheduler]):
    print("Starting job scheduler")
    job_scheduler.start()
    yield
    print("Stopping job scheduler")
    job_scheduler.shutdown()


def create_app() -> FastAPI:
    container = configure(Container())

    db = container.db()
    db.create_database()
    recital_manager = container.recital_manager()
    recital_manager.schedule_session_finalization_job(defer=True)

    app = FastAPI(lifespan=lifespan)

    setup_cors(app, container.config.cors.allow_origins())

    app.container = container
    app.mount("/api", api_app)  # Serves the backend api root
    app.mount("/env", get_web_client_env_app())  # Serves the web client dynamic configuration
    app.mount("/", get_web_client_app())  # Serves the web client root

    return app


app = create_app()
