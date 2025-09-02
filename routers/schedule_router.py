from fastapi import APIRouter, Query
from repository import schedule_repo
from models import schedule_model
from core.database import SessionDep
from typing import Optional

router = APIRouter(prefix="/schedules", tags=["schedules"])

@router.get("/")
def read_schedules(session: SessionDep):
    return schedule_repo.get_all_schedules(session)


@router.get("/timer/{line_id}")
def get_schedule_timer(line_id: int, session: SessionDep):
    """
    Endpoint para verificar status dos horários.
    Retorna:
    - true: Ônibus no local (current)
    - false: Próximo horário disponível hoje 
    - null: Sem horários no dia atual
    """
    return schedule_repo.schedule_timer(session, line_id)


@router.get("/current")
def get_current_schedule(session: SessionDep, line_id: Optional[int] = Query(None)):
    return schedule_repo.get_current_schedule(session, line_id)


@router.get("/next")
def get_next_schedule(session: SessionDep, line_id: Optional[int] = Query(None), today_only: Optional[bool] = Query(False)):
    return schedule_repo.get_next_schedule(session, line_id, today_only)


@router.post("/")
def create_schedule(schedule: schedule_model.Schedule, session: SessionDep):
    return schedule_repo.create_schedule(schedule, session)


@router.get("/by-line-time")
def get_schedule_by_line_and_time(session: SessionDep, line_id: int, departure_time: str):
    return schedule_repo.get_schedule_by_line_and_time(session, line_id, departure_time)


@router.post("/register-interest")
def register_interest(session: SessionDep, line_id: int, departure_time: str):
    return schedule_repo.register_interest(session, line_id, departure_time)


@router.get("/can-register-interest")
def can_register_interest(session: SessionDep, line_id: int, departure_time: str):
    can_register = schedule_repo.can_register_interest(session, line_id, departure_time)
    return {"can_register": can_register}


@router.get("/{schedule_id}")
def read_schedule(schedule_id: int, session: SessionDep):
    return schedule_repo.get_schedule(schedule_id, session)


@router.patch("/{schedule_id}")
def update_schedule(schedule_id: int, schedule: schedule_model.Schedule, session: SessionDep):
    return schedule_repo.update_schedule(schedule_id, schedule, session)


@router.delete("/{schedule_id}")
def delete_schedule(schedule_id: int, session: SessionDep):
    return schedule_repo.delete_schedule(schedule_id, session)


@router.patch("/interest/{schedule_id}")
def update_interest(schedule_id: int, session: SessionDep):
    return schedule_repo.update_interest(schedule_id, session)





