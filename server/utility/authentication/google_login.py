from typing import Annotated

from fastapi import Cookie, Form, HTTPException, status
from google.auth.transport import requests
from google.oauth2 import id_token
from pydantic import BaseModel


class GoogleIdentification(BaseModel):
    sub: str
    email: str
    email_verified: bool
    name: str
    picture: str


def validate_csrf_token(
    g_csrf_token: Annotated[str, Form()],
    g_csrf_token_from_cookie: Annotated[str, Cookie(alias="g_csrf_token", alias_priority=1)],
):
    if g_csrf_token != g_csrf_token_from_cookie:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="CSRF Validation Failed")


def get_google_identification(credential: Annotated[str, Form()]):
    id_token_info = id_token.verify_oauth2_token(
        credential,
        requests.Request(),
    )

    return GoogleIdentification(**id_token_info)
