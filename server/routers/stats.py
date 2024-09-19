from typing import Annotated

from dependency_injector.wiring import Provide, inject
from fastapi import APIRouter, Depends

from containers import Container
from resource_access.stats_ra import StatsRA, UserLeaderBoard

from .dependencies.analytics import Tracker
from .dependencies.users import User, get_speaker_user

router = APIRouter()


@router.get("/leaderboard", response_model=list[UserLeaderBoard])
@inject
async def get_session_preview(
    track_event: Tracker,
    stats_ra: StatsRA = Depends(Provide[Container.stats_ra]),
):
    return stats_ra.leader_board(10)
