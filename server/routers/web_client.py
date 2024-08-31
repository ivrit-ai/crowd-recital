import pathlib

from dependency_injector.wiring import Provide, inject
from fastapi import FastAPI
from fastapi.responses import PlainTextResponse, Response
from fastapi.staticfiles import StaticFiles
from pydantic import BaseModel

from containers import Container

env = FastAPI()


@inject
def get_web_client_env_app() -> FastAPI:
    return env


class ClientConfig(BaseModel):
    auth_google_client_id: str


class ClientEnv(BaseModel):
    config: ClientConfig


@env.get("/config.js", response_class=PlainTextResponse)
@inject
def get_env_config(response: Response, google_client_id: str = Provide[Container.config.auth.google.client_id]) -> str:
    client_env = ClientEnv(config=ClientConfig(auth_google_client_id=google_client_id))
    config_script_content = f"window.__env__ = {client_env.model_dump_json()}"
    return PlainTextResponse(content=config_script_content, headers={"Content-Type": "application/javascript"})


@inject
def get_web_client_app(dist_folder: str = Provide[Container.config.web_client_dist_folder]) -> FastAPI:
    return StaticFiles(directory=pathlib.Path(dist_folder), html=True)
