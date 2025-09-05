from fastapi import HTTPException
from sqlmodel import select
from core.database import SessionDep
from models import schedule_model
from models.schedule_model import Line
from datetime import datetime, timedelta


def create_schedule(schedule: schedule_model.ScheduleCreate, session: SessionDep):
    new_schedule = schedule_model.Schedule(
        line_id=schedule.line_id,
        arrival_time=schedule.arrival_time,
        departure_time=schedule.departure_time,
        day_week=schedule.day_week,
        interest=0
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


