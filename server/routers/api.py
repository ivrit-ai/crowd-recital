from dependency_injector.wiring import inject
from fastapi import APIRouter, FastAPI

from . import admin, documents, sessions, users
from .dependencies.analytics import AnonTracker

router = APIRouter()


@router.get("/status")
@inject
def get_status(track_event: AnonTracker):
    track_event("Status Checked", properties={"check_status": "ok"})
    return {"status": "OK"}


router.include_router(users.router)
router.include_router(sessions.router, prefix="/sessions")
router.include_router(admin.router, prefix="/admin")
router.include_router(documents.router, prefix="/documents")

api_app = FastAPI()
api_app.include_router(router, prefix="")
