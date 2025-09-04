from sqlmodel import SQLModel, Field
from enum import Enum
from datetime import datetime
from typing import List
from schemas.collaborator_schema import Collaborator


class StatusEnum(str, Enum):
    open = "open"
    closed = "closed"
    finished = "Finished"


class TripReport(SQLModel, table=True):
    id: int | None = Field(default=None, primary_key=True)

    bus_prefix: str
    external_schedule_id: int

    collaborator_id: List[int] = []
    people_count: int
    status: StatusEnum = Field(default_factory=StatusEnum.open)
    
    generated_trip_at: datetime = Field(default_factory=datetime.now)
    started_trip_at: datetime | None = None
    finished_trip_at: datetime | None = None

    whos_left: List[Collaborator] = []
