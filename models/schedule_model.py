from sqlmodel import SQLModel, Field, Relationship
from datetime import datetime

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
    
    city: City = Relationship(back_populates="lines")
    schedules: list["Schedule"] = Relationship(back_populates="line")


class Schedule(SQLModel, table=True):
    id: int | None = Field(default=None, primary_key=True)
    line_id: int = Field(default=None, foreign_key="line.id")
    arrival_time: datetime | None
    departure_time: datetime | None
    interest: int = Field(default=0)
    day_week: int | None
    status: bool = Field(default=False)

    line: Line = Relationship(back_populates="schedules")


class ScheduleRead(SQLModel):
    id: int
    arrival_time: datetime
    departure_time: datetime
    interest: int
    day_week: int
    status: bool

    class Config:
        orm_mode = True


class LineRead(SQLModel):
    id: int
    name: str
    active_bus: int
    schedules: list[ScheduleRead] = []

    class Config:
        orm_mode = True


class CityRead(SQLModel):
    id: int
    state: str
    country: str
    lines: list[LineRead] = []

    class Config:
        orm_mode = True