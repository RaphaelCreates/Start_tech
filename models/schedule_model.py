from sqlmodel import SQLModel, Field, Relationship
from datetime import datetime, time
from pydantic import validator
from enum import IntEnum

class City(SQLModel, table=True):
    id: int | None = Field(default=None, primary_key=True)
    state: str
    country: str

    lines: list["Line"] = Relationship(back_populates="city")


class Line(SQLModel, table=True):
    id: int | None = Field(default=None, primary_key=True)
    city_id: int | None = Field(default=None, foreign_key="city.id")
    name: str = Field(unique=True, index=True)
    active_bus: int
    active: bool | None = Field(default=None)
    
    city: City = Relationship(back_populates="lines")
    schedules: list["Schedule"] = Relationship(back_populates="line")


class DayOfWeek(IntEnum):
    MONDAY = 1
    TUESDAY = 2
    WEDNESDAY = 3
    THURSDAY = 4
    FRIDAY = 5


class ScheduleCreate(SQLModel):
    line_id: int
    arrival_time: str
    departure_time: str
    day_week: int
    interest: int = 0

    @validator("arrival_time", "departure_time")
    def parse_time_hhmm(cls, v: str) -> time:
        # Converte "HH:mm" para datetime.time com segundos zerados
        try:
            dt = datetime.strptime(v, "%H:%M")
            return dt.time()  # HH:MM:00
        except ValueError:
            raise ValueError(f"Horário inválido, deve ser HH:mm: {v}")



class Schedule(SQLModel, table=True):
    id: int | None = Field(default=None, primary_key=True)
    line_id: int = Field(foreign_key="line.id")
    arrival_time: time
    departure_time: time
    interest: int = Field(default=0)
    day_week: int = Field(index=True)  # Mudamos para int para aceitar valores diretos

    line: "Line" = Relationship(back_populates="schedules")
    
    @validator("day_week")
    def validate_day_week(cls, v):
        # Aceita tanto enum quanto int
        if isinstance(v, DayOfWeek):
            return v.value
        elif isinstance(v, int) and 1 <= v <= 5:
            return v
        else:
            raise ValueError(f"day_week deve ser entre 1-5, recebido: {v}")
    


class ScheduleRead(SQLModel):
    id: int
    arrival_time: time
    departure_time: time
    interest: int
    day_week: int

    class Config:
        from_attributes = True


class LineRead(SQLModel):
    id: int
    name: str
    active_bus: int
    active: bool | None = None
    schedules: list[ScheduleRead] = []

    class Config:
        from_attributes = True


class CityRead(SQLModel):
    id: int
    state: str
    country: str
    lines: list[LineRead] = []

    class Config:
        from_attributes = True