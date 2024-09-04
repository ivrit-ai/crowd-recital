from typing import Annotated, Any, Callable, Dict, Optional

from dependency_injector.wiring import Provide, inject
from fastapi import Depends
from posthog import Posthog

from containers import Container
from models.user import User

from .users import get_valid_user


@inject
def get_raw_tracker(posthog: Posthog = Depends(Provide[Container.posthog])):
    def track_event(*args, properties={}, **kwargs):
        merged_props = properties
        merged_props["source"] = "server"
        posthog.capture(*args, properties=merged_props, **kwargs)

    return track_event


@inject
def get_tracker(
    valid_user: Annotated[User, Depends(get_valid_user)], posthog: Posthog = Depends(Provide[Container.posthog])
):
    def track_event(event, *args, properties={}, **kwargs):
        merged_props = properties
        merged_props["source"] = "server"
        posthog.capture(valid_user.id, event, *args, properties=merged_props, **kwargs)

    return track_event


@inject
def get_anon_tracker(posthog: Posthog = Depends(Provide[Container.posthog])):
    def track_event(event, *args, properties={}, **kwargs):
        merged_props = properties
        merged_props["$process_person_profile"] = False
        merged_props["source"] = "server"
        posthog.capture("anon_user_id", event, *args, properties=merged_props, **kwargs)

    return track_event


RawTracker = Annotated[Callable[[str, str, Optional[Dict[str, Any]]], None], Depends(get_raw_tracker)]
Tracker = Annotated[Callable[[str, Optional[Dict[str, Any]]], None], Depends(get_tracker)]
AnonTracker = Annotated[Callable[[str, Optional[Dict[str, Any]]], None], Depends(get_anon_tracker)]
