from fastapi import APIRouter, Depends, Response, status
from dependency_injector.wiring import inject, Provide

from .containers import Container
from .resource_access.documents_ra import DocumentsRA

router = APIRouter()


@router.get("/test")
@inject
def get_list(
        documents_ra: DocumentsRA = Depends(Provide[Container.documents_ra]),
):
    l = documents_ra.get_all()
    print(l)
    return "t"

@router.get("/status")
def get_status():
    return {"status": "OK"}