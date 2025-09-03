from sqlmodel import SQLModel, Field
from enum import Enum
from datetime import datetime

class StatusEnum(str, Enum):
    open = "open"
    closed = "closed"
    finished = "finished"


class Queue(SQLModel, table=True):
    id: int | None = Field(default=None, primary_key=True)
    bus_prefix: str | None = Field(default=None, foreign_key="bus.prefix")
    people_inside: int | None = Field(default=None)
    schedule_id: int | None
    status: StatusEnum = Field(default=StatusEnum.open)
    departure_time: datetime | None
