from fastapi import HTTPException
from sqlmodel import select
from core.database import SessionDep
from models import schedule_model

def create_line(line: schedule_model.Line, session: SessionDep):
    existing_line = session.exec(select(schedule_model.Line).where(schedule_model.Line.name == line.name)).first()
    if existing_line:
        raise HTTPException(status_code=400, detail="A line with this name already exists.")
    new_line = schedule_model.Line(name=line.name, active_bus=line.active_bus)
    session.add(new_line)
    session.commit()
    session.refresh(new_line)
    return new_line


def get_line(line_id: int, session: SessionDep):
    line = session.exec(select(schedule_model.Line).where(schedule_model.Line.id == line_id)).first()
    if not line:
        raise HTTPException(status_code=404, detail="Line not found")
    return line


def get_all_lines(session: SessionDep):
    lines = session.exec(select(schedule_model.Line)).all()
    return lines


def update_line(line_id: int, line: schedule_model.Line, session: SessionDep):
    existing_line = session.exec(select(schedule_model.Line).where(schedule_model.Line.id == line_id)).first()
    if not existing_line:
        raise HTTPException(status_code=404, detail="Line not found")
    existing_line.name = line.name
    existing_line.active_bus = line.active_bus
    session.commit()
    session.refresh(existing_line)
    return existing_line


def delete_line(line_id: int, session: SessionDep):
    existing_line = session.exec(select(schedule_model.Line).where(schedule_model.Line.id == line_id)).first()
    if not existing_line:
        raise HTTPException(status_code=404, detail="Line not found")
    session.delete(existing_line)
    session.commit()
    return {"detail": "Line deleted successfully"}


def get_line_schedules(line_id: int, session: SessionDep) -> list[schedule_model.Schedule]:
    line = session.exec(select(schedule_model.Line).where(schedule_model.Line.id == line_id)).first()
    if not line:
        raise HTTPException(status_code=404, detail="Line not found")
    return line.schedules