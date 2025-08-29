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
    arrival_time: datetime
    departure_time: datetime

    line: Line = Relationship(back_populates="schedules")
