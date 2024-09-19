from contextlib import AbstractContextManager
from datetime import datetime
from typing import Callable

from dependency_injector.wiring import Provide
from pydantic import BaseModel
from sqlmodel import Numeric, Session, cast, func, select

from models.recital_session import RecitalSession, SessionStatus
from models.user import User
from utility.cache.stats import region, CacheKeys


class UserLeaderBoard(BaseModel):
    name: str
    created_at: datetime
    total_duration: float
    total_recordings: int


class StatsRA:
    def __init__(
        self,
        session_factory: Callable[..., AbstractContextManager[Session]],
    ) -> None:
        self.session_factory = session_factory

    @region.cache_on_arguments(namespace={"fixed_key": CacheKeys.leaderboard}, expiration_time=60 * 1)
    def leader_board(self, top: int = 10) -> list[UserLeaderBoard]:
        with self.session_factory() as session:

            user_session_totals = (
                select(
                    RecitalSession.user_id,
                    cast(func.sum(RecitalSession.duration).label("total_duration"), Numeric),
                    func.count(RecitalSession.id).label("total_recordings"),
                )
                .filter(RecitalSession.status == SessionStatus.UPLOADED)
                .group_by(RecitalSession.user_id)
                .cte(name="user_session_totals")
            )
            leader_board_selectable = (
                select(
                    User.name,
                    User.created_at,
                    user_session_totals.c.total_duration,
                    user_session_totals.c.total_recordings,
                )
                .join(User)
                .order_by(user_session_totals.c.total_duration.desc())
                .limit(top)
            )

            results = session.exec(leader_board_selectable)

            return results.all()
