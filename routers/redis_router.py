from fastapi import APIRouter
from repository import redis_repo
from schemas.pass_schema import PassPayload
from core.database import SessionDep

router = APIRouter(prefix="/queue", tags=["queue"])

@router.post("/api/trips/pass")
def pass_trip(payload: PassPayload):
    return redis_repo.pass_person(payload)

@router.get("/api/trips/{schedule_id}/count")
def get_trip_count(schedule_id: int):
    return redis_repo.get_trip_count(schedule_id)
