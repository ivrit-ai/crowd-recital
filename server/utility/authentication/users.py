from datetime import datetime, timedelta, timezone

from dependency_injector.wiring import Provide, inject
import jwt
from pydantic import BaseModel

from containers import Container
from models.user import User
from .google_login import GoogleIdentification

ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 60 * 24


class AccessTokenPayload(BaseModel):
    sub: str
    email: str
    name: str
    picture: str


def get_access_token_expire_minutes():
    return ACCESS_TOKEN_EXPIRE_MINUTES


@inject
def encode_access_token(
    data: dict,
    expires_delta: timedelta | None = None,
    access_token_secret_key: str = Provide[Container.config.auth.access_token_secret_key],
):
    to_encode = data.copy()
    if expires_delta:
        expire = datetime.now(timezone.utc) + expires_delta
    else:
        expire = datetime.now(timezone.utc) + timedelta(minutes=15)
    to_encode.update({"exp": expire})
    encoded_jwt = jwt.encode(to_encode, access_token_secret_key, algorithm=ALGORITHM)
    return encoded_jwt


@inject
def decode_access_token(
    token: str, access_token_secret_key: str = Provide[Container.config.auth.access_token_secret_key]
):
    payload = jwt.decode(token, access_token_secret_key, algorithms=[ALGORITHM])
    return payload


def create_user_from_google_id(google_identification: GoogleIdentification):
    return User(
        email=google_identification.email,
        email_verified=google_identification.email_verified,
        name=google_identification.name,
        picture=google_identification.picture,
        google_sub=google_identification.sub,
    )


def create_access_token_payload_from_user(user: User):
    return AccessTokenPayload(
        sub=str(user.id),
        email=user.email,
        name=user.name,
        picture=user.picture,
    )


def create_empty_speaker_user(email: str):
    return User(email=email, email_verified=False, name=f"Pre Approved Speaker {email}", picture="")
