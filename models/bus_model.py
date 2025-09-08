from sqlmodel import SQLModel, Field

class Bus(SQLModel, table=True):
    prefix: int | None = Field(default=None, primary_key=True)
    capacity: int = Field(default=None)
    ocupied: int = Field(default=0)


class BusOccupancyUpdate(SQLModel):
    ocupied: int = Field(ge=0, description="Number of occupied seats (must be >= 0)")


class BusOccupancyInfo(SQLModel):
    prefix: int
    capacity: int
    ocupied: int
    available_seats: int
    occupancy_percentage: float
    is_full: bool