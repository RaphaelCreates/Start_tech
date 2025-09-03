from sqlmodel import SQLModel, Field
from enum import Enum
from datetime import datetime

class Bus(SQLModel, table=True):
    prefix: str | None = Field(default=None, primary_key=True)
    capacity: int = Field(default=None)