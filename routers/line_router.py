from fastapi import APIRouter, Query
from repository import line_repo
from models import schedule_model
from core.database import SessionDep
from typing import List, Optional

router = APIRouter(prefix="/lines", tags=["lines"])

@router.get("/", response_model=List[schedule_model.LineRead])
def read_lines(
    state: Optional[str] = Query(None, description="Filter lines by state (e.g., 'SP', 'RJ')"), 
    active: Optional[bool] = Query(None, description="Filter lines by active status"),
    session: SessionDep = None
):
    if active is True:
        return line_repo.get_active_lines(session)
    elif state:
        return line_repo.get_lines_by_state(state, session)
    return line_repo.get_all_lines(session)

@router.post("/")
def create_line(line: schedule_model.Line, session: SessionDep):
    return line_repo.create_line(line, session)

@router.get("/{line_id}", response_model=schedule_model.LineRead)
def read_line(line_id: int, session: SessionDep):
    line = line_repo.get_line(line_id, session)
    return schedule_model.LineRead.model_validate(line)

@router.put("/{line_id}")
def update_line(line_id: int, line: schedule_model.Line, session: SessionDep):
    return line_repo.update_line(line_id, line, session)

@router.delete("/{line_id}")
def delete_line(line_id: int, session: SessionDep):
    return line_repo.delete_line(line_id, session)

@router.get("/{line_id}/schedules", response_model=List[schedule_model.ScheduleRead])
def read_line_schedules(line_id: int, session: SessionDep):
    return line_repo.get_line_schedules(line_id, session)

@router.get("/{line_id}/status")
def get_line_status(line_id: int, session: SessionDep):
    return line_repo.get_line_status(line_id, session)

@router.patch("/{line_id}/status")
def update_line_status(line_id: int, status_update: schedule_model.LineStatusUpdate, session: SessionDep):
    return line_repo.update_line_status(line_id, status_update.active, session)

@router.get("/{line_id}/buses")
def get_line_buses(line_id: int, session: SessionDep):
    """Lista todos os ônibus atribuídos a uma linha específica"""
    from repository import bus_repo
    return bus_repo.get_buses_by_line(session, line_id)