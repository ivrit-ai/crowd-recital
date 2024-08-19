import pathlib

from dependency_injector.wiring import inject, Provide
from fastapi import FastAPI
from fastapi.staticfiles import StaticFiles

from ..containers import Container


@inject
def get_web_client_app(dist_folder: str = Provide[Container.config.web_client_dist_folder]) -> FastAPI:
    return StaticFiles(directory=pathlib.Path(dist_folder), html=True)
