from sqlmodel import SQLModel, Field

class BusBase(SQLModel):
    prefix: int
    capacity: int
    occupied: int = Field(default=0, ge=0, description="Number of occupied seats (must be >= 0)")

class Bus(BusBase, table=True):
    prefix: int = Field(primary_key=True)
    capacity: int | None = Field(default=None)
    occupied: int = Field(default=0, ge=0, description="Number of occupied seats (must be >= 0)")
    active_line_id: int | None = Field(default=None, foreign_key="line.id")


class BusOccupancyUpdate(SQLModel):
    occupied: int = Field(ge=0, description="Number of occupied seats (must be >= 0)")


class BusOccupancyInfo(SQLModel):
    prefix: int
    capacity: int
    occupied: int
    available_seats: int
    occupancy_percentage: float
    is_full: bool