from datetime import timedelta
from typing import Annotated

from dependency_injector.wiring import Provide, inject
from fastapi import APIRouter, Depends, Form, Response, status
from pydantic import BaseModel

from containers import Container
from models.user import User
from models.user_metadata import UserMetadata, UserMetadataUpdate
from resource_access.users_ra import UsersRA
from utility.authentication.google_login import (
    GoogleIdentification,
    get_google_identification,
    validate_csrf_token,
)
from utility.authentication.invites import validate_invite_value
from utility.authentication.users import (
    create_access_token_payload_from_user,
    create_user_from_google_id,
    encode_access_token,
    get_access_token_expire_minutes,
    record_user_agreement,
)

from .dependencies.analytics import AnonTracker, RawTracker, Tracker
from .dependencies.users import (
    AuthCookie,
    get_valid_user,
    set_access_token_cookie,
    unset_access_token_cookie,
)

router = APIRouter()


class LoginResponse(BaseModel):
    access_token: str
    token_type: str
    expires_in: int
    scope: str


@router.post("/login", dependencies=[Depends(validate_csrf_token)], response_model=LoginResponse)
@inject
async def login_user(
    track_event: RawTracker,
    google_identification: Annotated[GoogleIdentification, Depends(get_google_identification)],
    invite_value: Annotated[str, Form()],
    response: Response,
    users_ra: UsersRA = Depends(Provide[Container.users_ra]),
):
    derived_user_from_google_id = create_user_from_google_id(google_identification)
    # NOTE: we are not checking the email_verified flag
    # This is to simplify the implementation - but poses a security risk.
    # In theory - a user can take on an unverified email of another user and assume
    # control of that user.
    # In practice - this is not a big problem since we only use google login
    # and anyway not expect users to try and hack this system (famous last words - blame Yair.L)
    existing_user = users_ra.get_by_email(derived_user_from_google_id.email)

    # Valid invites ensure auto speaker approval
    has_valid_invite = validate_invite_value(invite_value)

    if not existing_user:
        if has_valid_invite:
            derived_user_from_google_id.group = "speaker"

        users_ra.upsert(derived_user_from_google_id)
        track_event(derived_user_from_google_id.id, "User Signed Up")
    else:
        existing_user.picture = derived_user_from_google_id.picture
        existing_user.name = derived_user_from_google_id.name
        existing_user.email_verified = derived_user_from_google_id.email_verified

        if has_valid_invite and existing_user.group is None:
            track_event(derived_user_from_google_id.id, "User Self Approved Speaker")
            existing_user.group = "speaker"

        users_ra.upsert(existing_user)

    user_email = existing_user.email if existing_user else derived_user_from_google_id.email
    existing_user = users_ra.get_by_email(user_email)

    user_token_payload = create_access_token_payload_from_user(existing_user)
    access_token_expires = timedelta(minutes=get_access_token_expire_minutes())
    access_token = encode_access_token(user_token_payload.model_dump(), expires_delta=access_token_expires)
    set_access_token_cookie(response, access_token)
    response.headers["Cache-Control"] = "no-store"
    response.status_code = status.HTTP_200_OK

    track_event(existing_user.id, "User Logged In")
    return LoginResponse(
        access_token=access_token, token_type="bearer", expires_in=int(access_token_expires.total_seconds()), scope=""
    )


@router.post("/logout")
def logout(track_event: AnonTracker, response: Response, auth_cookie: AuthCookie = None):
    if auth_cookie:
        unset_access_token_cookie(response)
        response.headers["Cache-Control"] = "no-store"
        response.status_code = status.HTTP_200_OK

    track_event("User Logged Out")
    return {"message": "Logged out"}


@router.get("/me", response_model=User)
@inject
def get_me(active_user: Annotated[User, Depends(get_valid_user)]):
    return active_user


@router.get("/me/profile", response_model=UserMetadata)
@inject
def get_profile(
    active_user: Annotated[User, Depends(get_valid_user)], users_ra: UsersRA = Depends(Provide[Container.users_ra])
):
    return users_ra.get_profile_by_id(active_user.id)


@router.patch("/me/profile")
@inject
def update_profile(
    track_event: Tracker,
    active_user: Annotated[User, Depends(get_valid_user)],
    user_metadata_update: UserMetadataUpdate,
    users_ra: UsersRA = Depends(Provide[Container.users_ra]),
):
    users_ra.upsert_profile(active_user.id, user_metadata_update)
    track_event("User Updated Profile")

    return users_ra.get_profile_by_id(active_user.id)


@router.post("/me/agree")
@inject
def update_me(track_event: Tracker, active_user: Annotated[User, Depends(get_valid_user)]):
    record_user_agreement(active_user)
    track_event("User Agreed to Terms")
