from fastapi import HTTPException
from sqlmodel import select
from core.database import SessionDep
from models import schedule_model
from datetime import datetime

def create_schedule(schedule: schedule_model.Schedule, session: SessionDep):
    new_schedule = schedule_model.Schedule(
        line_id=schedule.line_id,
        arrival_time=datetime.now(),
        departure_time=datetime.now()
    )
    session.add(new_schedule)
    session.commit()
    session.refresh(new_schedule)
    return new_schedule


def get_schedule(schedule_id: int, session: SessionDep):
    schedule = session.exec(select(schedule_model.Schedule).where(schedule_model.Schedule.id == schedule_id)).first()
    if not schedule:
        raise HTTPException(status_code=404, detail="Schedule not found")
    return schedule


def get_all_schedules(session: SessionDep):
    schedules = session.exec(select(schedule_model.Schedule)).all()
    if not schedules:
        raise HTTPException(status_code=404, detail="No schedules found")
    return schedules


def update_schedule(schedule_id: int, request: schedule_model.Schedule, session: SessionDep):
    db_schedule = session.exec(select(schedule_model.Schedule).where(schedule_model.Schedule.id == schedule_id)).first()
    if not db_schedule:
        raise HTTPException(status_code=404, detail="Schedule not found")
    schedule_data = request.model_dump(exclude_unset=True)
    db_schedule.sqlmodel_update(schedule_data)
    session.add(db_schedule)
    session.commit()
    session.refresh(db_schedule)
    return db_schedule


def update_interest(schedule_id: int, session: SessionDep):
    db_schedule = session.exec(select(schedule_model.Schedule).where(schedule_model.Schedule.id == schedule_id)).first()
    if not db_schedule:
        raise HTTPException(status_code=404, detail="Schedule not found")
    db_schedule.interest += 1
    session.add(db_schedule)
    session.commit()
    session.refresh(db_schedule)
    return db_schedule


def delete_schedule(schedule_id: int, session: SessionDep):
    existing_schedule = session.exec(select(schedule_model.Schedule).where(schedule_model.Schedule.id == schedule_id)).first()
    if not existing_schedule:
        raise HTTPException(status_code=404, detail="Schedule not found")
    session.delete(existing_schedule)
    session.commit()
    return {"detail": "Schedule deleted successfully"}


def get_current_schedule(session: SessionDep) -> schedule_model.Schedule | None:
    now = datetime.now()
    current_schedule = session.exec(
        select(schedule_model.Schedule)
        .where(schedule_model.Schedule.arrival_time <= now)
        .where(schedule_model.Schedule.departure_time >= now)
    ).first()
    return current_schedule


def get_next_schedule(session: SessionDep) -> schedule_model.Schedule | None:
    now = datetime.now().time()

    # pega todos os horários ordenados
    schedules = session.exec(select(schedule_model.Schedule).order_by(schedule_model.Schedule.arrival_time)).all()
    if not schedules:
        return None

    # procura o próximo horário ainda hoje
    for schedule in schedules:
        if schedule.arrival_time > now:
            return schedule

    # se já passou de todos, retorna o primeiro (amanhã)
    return schedules[0]