from typing import Annotated

from dependency_injector.wiring import Provide, inject
from fastapi import APIRouter, Depends

from containers import Container
from resource_access.stats_ra import StatsRA, UserLeaderBoard, UserStats, TotalStats

from .dependencies.analytics import Tracker
from .dependencies.users import User, get_speaker_user

router = APIRouter()


@router.get("/me", response_model=UserStats)
@inject
async def get_user_totals(
    speaker_user: Annotated[User, Depends(get_speaker_user)],
    stats_ra: StatsRA = Depends(Provide[Container.stats_ra]),
):
    return stats_ra.user_stats(speaker_user.id)


@router.get("/leaderboard", response_model=list[UserLeaderBoard])
@inject
async def get_leaderboard(
    stats_ra: StatsRA = Depends(Provide[Container.stats_ra]),
    leaderboard_depth: int = Depends(Provide[Container.config.stats.leaderboard_depth]),
):
    return stats_ra.leader_board(leaderboard_depth)


@router.get("/totals", response_model=TotalStats)
@inject
async def get_totals(
    stats_ra: StatsRA = Depends(Provide[Container.stats_ra]),
):

    return stats_ra.totals()
