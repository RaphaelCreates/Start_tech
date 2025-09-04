from sqlmodel import SQLModel, Field, Relationship
from models.bus_model import Bus
from enum import Enum
from datetime import datetime


class StatusEnum(str, Enum):
    open = "open"
    closed = "closed"
    finished = "finished"


class TripReport(SQLModel, table=True):
    id: int | None = Field(default=None, primary_key=True)

    bus_prefix: str = Field(foreign_key="bus.prefix")
    external_schedule_id: int  # linka com a outra API

    people_inside: int
    status: StatusEnum = Field(default=StatusEnum.finished)
    generated_at: datetime = Field(default_factory=datetime.now)