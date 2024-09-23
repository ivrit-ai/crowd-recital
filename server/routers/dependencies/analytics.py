from inspect import BoundArguments, signature
from typing import Annotated, Any, Callable, Dict, Optional

from dependency_injector.wiring import Provide, inject
from fastapi import Depends
from posthog import Posthog


from containers import Container
from models.user import User

from .users import get_valid_user


@inject
def get_raw_tracker(posthog: Posthog = Depends(Provide[Container.posthog])):
    return posthog.capture


@inject
def get_tracker(
    valid_user: Annotated[User, Depends(get_valid_user)], posthog: Posthog = Depends(Provide[Container.posthog])
):
    capture_sig = signature(posthog.capture)

    def track_event(event, *args, **kwargs):
        capture_args = capture_sig.bind(valid_user.id, event, *args, **kwargs)
        posthog.capture(*capture_args.args, **capture_args.kwargs)

    return track_event


@inject
def get_anon_tracker(posthog: Posthog = Depends(Provide[Container.posthog])):
    capture_sig = signature(posthog.capture)

    def track_event(event, *args, **kwargs):
        capture_args = capture_sig.bind("anon_user_id", event, *args, **kwargs)
        if not capture_args.arguments.get("properties"):
            capture_args.arguments["properties"] = {}

        capture_args.arguments["properties"]["$process_person_profile"] = False
        posthog.capture(*capture_args.args, **capture_args.kwargs)

    return track_event


RawTracker = Annotated[Callable[[str, str, Optional[Dict[str, Any]]], None], Depends(get_raw_tracker)]
Tracker = Annotated[Callable[[str, Optional[Dict[str, Any]]], None], Depends(get_tracker)]
AnonTracker = Annotated[Callable[[str, Optional[Dict[str, Any]]], None], Depends(get_anon_tracker)]
