from fastapi import APIRouter, Query, Depends
from repository import line_repo
from models import schedule_model
from sqlalchemy.ext.asyncio import AsyncSession
from core.database import get_session
from typing import List, Optional

router = APIRouter(prefix="/lines", tags=["lines"])

@router.get("/", response_model=List[schedule_model.LineRead])
async def read_lines(
    state: Optional[str] = Query(None, description="Filter lines by state (e.g., 'SP', 'RJ')"), 
    active: Optional[bool] = Query(None, description="Filter lines by active status"),
    session: AsyncSession = Depends(get_session)
):
    if active is True:
        return await line_repo.get_active_lines(session)
    elif state:
        return await line_repo.get_lines_by_state(state, session)
    return await line_repo.get_all_lines(session)

@router.post("/")
async def create_line(line: schedule_model.Line, session: AsyncSession = Depends(get_session)):
    return await line_repo.create_line(line, session)

@router.get("/{line_id}", response_model=schedule_model.LineRead)
async def read_line(line_id: int, session: AsyncSession = Depends(get_session)):
    line = await line_repo.get_line(line_id, session)
    return schedule_model.LineRead.model_validate(line)

@router.put("/{line_id}")
async def update_line(line_id: int, line: schedule_model.Line, session: AsyncSession = Depends(get_session)):
    return await line_repo.update_line(line_id, line, session)

@router.delete("/{line_id}")
async def delete_line(line_id: int, session: AsyncSession = Depends(get_session)):
    return await line_repo.delete_line(line_id, session)

@router.get("/{line_id}/schedules", response_model=List[schedule_model.ScheduleRead])
async def read_line_schedules(line_id: int, session: AsyncSession = Depends(get_session)):
    return await line_repo.get_line_schedules(line_id, session)

@router.get("/{line_id}/status")
async def get_line_status(line_id: int, session: AsyncSession = Depends(get_session)):
    return await line_repo.get_line_status(line_id, session)

@router.patch("/{line_id}/status")
async def update_line_status(line_id: int, status_update: schedule_model.LineStatusUpdate, session: AsyncSession = Depends(get_session)):
    return await line_repo.update_line_status(line_id, status_update.active, session)

@router.get("/{line_id}/buses")
async def get_line_buses(line_id: int, session: AsyncSession = Depends(get_session)):
    from repository import bus_repo
    return await bus_repo.get_buses_by_line(session, line_id)