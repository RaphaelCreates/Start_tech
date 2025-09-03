from sqlmodel import SQLModel, Field
from datetime import datetime

class Queue(SQLModel, table=True):
    id: int = Field(default=None, primary_key=True)
    line_name: str = Field(default=None)
    schedule_id: str = Field(default=None)
    capacity: int = Field(default=None)
    interested: int = Field(default=0)
    status: str = Field(default="open")  # e.g., open, closed, finished
    arrive_time: datetime
