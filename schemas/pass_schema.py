from pydantic import BaseModel

class PassPayload(BaseModel):
    user_id: str
    schedule_id: int