from datetime import timedelta
from typing import Annotated


from dependency_injector.wiring import inject, Provide
from fastapi import (
    APIRouter,
    Depends,
    Response,
    status,
)
from pydantic import BaseModel

from ..containers import Container
from ..models.user import User
from .dependencies.users import (
    get_valid_user,
    set_access_token_cookie,
    unset_access_token_cookie,
    AuthCookie,
)
from ..utility.authentication.google_login import (
    GoogleIdentification,
    validate_csrf_token,
    get_google_identification,
)
from ..utility.authentication.users import (
    create_user_from_google_id,
    create_access_token_payload_from_user,
    encode_access_token,
    get_access_token_expire_minutes,
)
from ..resource_access.users_ra import UsersRA

router = APIRouter()


class LoginResponse(BaseModel):
    access_token: str
    token_type: str
    expires_in: int
    scope: str


@router.post("/login", dependencies=[Depends(validate_csrf_token)], response_model=LoginResponse)
@inject
async def login_user(
    google_identification: Annotated[GoogleIdentification, Depends(get_google_identification)],
    response: Response,
    users_ra: UsersRA = Depends(Provide[Container.users_ra]),
):
    user = create_user_from_google_id(google_identification)
    users_ra.upsert(user)
    user_token_payload = create_access_token_payload_from_user(user)
    access_token_expires = timedelta(minutes=get_access_token_expire_minutes())
    access_token = encode_access_token(user_token_payload.model_dump(), expires_delta=access_token_expires)
    set_access_token_cookie(response, access_token)
    response.headers["Cache-Control"] = "no-store"
    response.status_code = status.HTTP_200_OK
    return LoginResponse(
        access_token=access_token, token_type="bearer", expires_in=int(access_token_expires.total_seconds()), scope=""
    )


@router.post("/logout")
def logout(response: Response, auth_cookie: AuthCookie = None):
    if auth_cookie:
        unset_access_token_cookie(response)
        response.headers["Cache-Control"] = "no-store"
        response.status_code = status.HTTP_200_OK
    return {"message": "Logged out"}


@router.get("/me", response_model=User)
@inject
def get_me(
    active_user: Annotated[User, Depends(get_valid_user)],
    response: Response,
    users_ra: UsersRA = Depends(Provide[Container.users_ra]),
):
    user = users_ra.get_by_id(active_user.id)
    if user is None:
        response.status_code = status.HTTP_404_NOT_FOUND
        return {"message": "User not found"}

    return user.model_dump()
