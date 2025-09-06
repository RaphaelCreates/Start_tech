from fastapi import HTTPException
from sqlmodel import select
from sqlalchemy.orm import selectinload
from sqlalchemy import asc
from core.database import SessionDep
from models import schedule_model
from models.schedule_model import Line, LineRead, City, Schedule

def create_line(line: schedule_model.Line, session: SessionDep):
    existing = session.exec(select(schedule_model.Line).where(schedule_model.Line.name == line.name)).first()
    if existing:
        raise HTTPException(status_code=400, detail="Line already exists.")
    session.add(line)
    session.commit()
    session.refresh(line)
    return line

def get_line(line_id: int, session: SessionDep):
    line = session.exec(select(schedule_model.Line).where(schedule_model.Line.id == line_id)).first()
    if not line:
        raise HTTPException(status_code=404, detail="Line not found")
    return line

def get_all_lines(session: SessionDep) -> list[LineRead]:
    lines = session.exec(
        select(Line).options(selectinload(Line.schedules))
    ).all()
    return [LineRead.model_validate(line) for line in lines]

def get_lines_by_state(state: str, session: SessionDep) -> list[LineRead]:
    lines = session.exec(
        select(Line)
        .join(City)
        .where(City.state == state.upper())
        .options(selectinload(Line.schedules))
    ).all()
    return [LineRead.model_validate(line) for line in lines]

def update_line(line_id: int, line: schedule_model.Line, session: SessionDep):
    existing = session.exec(select(schedule_model.Line).where(schedule_model.Line.id == line_id)).first()
    if not existing:
        raise HTTPException(status_code=404, detail="Line not found")
    existing.name = line.name
    existing.active_bus = line.active_bus
    session.commit()
    session.refresh(existing)
    return existing

def delete_line(line_id: int, session: SessionDep):
    existing = session.exec(select(schedule_model.Line).where(schedule_model.Line.id == line_id)).first()
    if not existing:
        raise HTTPException(status_code=404, detail="Line not found")
    session.delete(existing)
    session.commit()
    return {"detail": "Line deleted successfully"}

def get_line_schedules(line_id: int, session: SessionDep) -> list[schedule_model.ScheduleRead]:
    line = session.exec(
        select(Line).options(selectinload(Line.schedules)).where(Line.id == line_id)
    ).first()
    if not line:
        raise HTTPException(status_code=404, detail="Line not found")
    return [schedule_model.ScheduleRead.model_validate(s) for s in line.schedules]