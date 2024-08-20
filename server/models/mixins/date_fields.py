from datetime import datetime, timezone


from sqlmodel import SQLModel, Field, Column, func, DateTime, TIMESTAMP, text


class DateFieldsMixin:
    created_at: datetime = Field(
        sa_type=TIMESTAMP(timezone=False),
        sa_column_kwargs={
            "server_default": func.now(),
        },
        nullable=False,
    )
    updated_at: datetime | None = Field(
        default_factory=lambda: datetime.now(timezone.utc),
        nullable=False,
        sa_column_kwargs={
            "onupdate": lambda: datetime.now(timezone.utc),
        },
    )
