from datetime import datetime
from sqlmodel import SQLModel, Field

class Collaborator(SQLModel):
    collaborator_id: str
    hours: datetime = Field(default_factory=datetime.now)