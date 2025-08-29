from fastapi import APIRouter
from repository import schedule_repo
from models import schedule_model
from core.database import SessionDep

router = APIRouter(prefix="/schedules", tags=["schedules"])

@router.get("/")
def read_schedules(session: SessionDep):
    return schedule_repo.get_all_schedules(session)


@router.post("/")
def create_schedule(schedule: schedule_model.Schedule, session: SessionDep):
    return schedule_repo.create_schedule(schedule, session)


@router.get("/{schedule_id}")
def read_schedule(schedule_id: int, session: SessionDep):
    return schedule_repo.get_schedule(schedule_id, session)


@router.put("/{schedule_id}")
def update_schedule(schedule_id: int, schedule: schedule_model.Schedule, session: SessionDep):
    return schedule_repo.update_schedule(schedule_id, schedule, session)


@router.delete("/{schedule_id}")
def delete_schedule(schedule_id: int, session: SessionDep):
    return schedule_repo.delete_schedule(schedule_id, session)
