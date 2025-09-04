from sqlmodel import SQLModel, Field, Relationship
from models.bus_model import Bus
from enum import Enum
from datetime import datetime


class StatusEnum(str, Enum):
    open = "open"
    closed = "closed"
    finished = "Finished"


class TripReport(SQLModel, table=True):
    id: int | None = Field(default=None, primary_key=True)

    bus_prefix: str = Field(foreign_key="bus.prefix")
    external_schedule_id: int  # linka com a outra API
    # Matricula do colaorador
    # 

    people_inside: int
    status: StatusEnum = Field(default=StatusEnum.open)
    # Registra chegada na totvs
    generated_at: datetime = Field(default_factory=datetime.now)
    # Registrar incio de viagem
    # Registrar chegada do destino

    # Registrar caso alguem saia no meio do trajeto

    # caso alguem saia no meio do trajeto registrar