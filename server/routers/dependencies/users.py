from typing import Annotated
from uuid import UUID

from dependency_injector.wiring import Provide, inject
from fastapi import Cookie, Depends, HTTPException, Response, status
from fastapi.security import (APIKeyCookie, HTTPAuthorizationCredentials,
                              HTTPBearer)
from jwt.exceptions import InvalidTokenError
from nanoid import generate
from pydantic import BaseModel

from containers import Container
from models.user import User
from resource_access.users_ra import UsersRA
from utility.authentication.users import (decode_access_token,
                                          get_access_token_expire_minutes)

AUTH_COOKIE_NAME = "access_token"

http_bearer_security = HTTPBearer(auto_error=False)
api_key_cookie_security = APIKeyCookie(name=AUTH_COOKIE_NAME, auto_error=False)

AuthCookie = Annotated[str | None, Cookie(alias=AUTH_COOKIE_NAME, alias_priority=1)]
CredentialsBearer = Annotated[HTTPAuthorizationCredentials, Depends(http_bearer_security)]
CredentialsCookie = Annotated[str, Depends(api_key_cookie_security)]


def set_access_token_cookie(response: Response, access_token: str):
    response.set_cookie(
        key=AUTH_COOKIE_NAME,
        value=access_token,
        max_age=get_access_token_expire_minutes() * 60,
        httponly=True,
        secure=True,
        samesite="strict",
    )


def unset_access_token_cookie(response: Response):
    response.delete_cookie(
        key=AUTH_COOKIE_NAME,
        httponly=True,
        secure=True,
        samesite="strict",
    )


class AuthenticationErrorDetails(BaseModel):
    google_client_id: str
    g_csrf_token: str


@inject
def get_authenticated_user_id(
    response: Response,
    credentials_bearer: CredentialsBearer,
    credentials_cookie: CredentialsCookie,
    google_client_id: str = Provide[Container.config.auth.google.client_id],
) -> UUID:
    try:
        if credentials_bearer:
            credentials = credentials_bearer.credentials
        else:
            credentials = credentials_cookie
        if credentials:
            payload = decode_access_token(credentials)
            user_id: UUID = payload.get("sub")
            if user_id:
                return user_id
    except InvalidTokenError:
        pass

    auth_error_details = AuthenticationErrorDetails(google_client_id=google_client_id, g_csrf_token=generate(size=16))
    auth_error_details_dump = auth_error_details.model_dump()
    response.set_cookie("g_csrf_token", value=auth_error_details.g_csrf_token)
    headers = {"set-cookie": response.headers["set-cookie"], "Cache-Control": "no-store"}
    auth_error_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED, detail=auth_error_details_dump, headers=headers
    )
    raise auth_error_exception


@inject
async def get_valid_user(
    authenticated_user_id: Annotated[str, Depends(get_authenticated_user_id)],
    users_ra: UsersRA = Depends(Provide[Container.users_ra]),
):
    user = users_ra.get_by_id(authenticated_user_id)
    if not user:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="User not found")

    return user


def has_speaker_permission(user: User):
    return user.group == "speaker" or user.group == "admin"


async def get_speaker_user(user: Annotated[User, Depends(get_valid_user)]):
    if not has_speaker_permission(user):
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="User is not an authorized speaker")
    return user
