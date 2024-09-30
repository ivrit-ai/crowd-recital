from datetime import date, datetime
from typing import Annotated

from pydantic import PlainSerializer


# Types that help dumping date field from Pydantic onto a JSON field in the DB (within a Dict)

JsonSerializableDate = Annotated[
    date, PlainSerializer(lambda dt: dt.isoformat(), return_type=str, when_used="unless-none")
]

JsonSerializableDatetime = Annotated[
    datetime, PlainSerializer(lambda dt: dt.isoformat(), return_type=str, when_used="unless-none")
]
