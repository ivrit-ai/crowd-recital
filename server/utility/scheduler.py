from pytz import utc
from apscheduler.schedulers.base import BaseScheduler
from apscheduler.schedulers.asyncio import AsyncIOScheduler


class JobScheduler(AsyncIOScheduler):
    def __init__(self):
        super().__init__(timezone=utc)
