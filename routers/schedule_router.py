from fastapi import APIRouter, Query, Depends
from repository import schedule_repo
from models import schedule_model
from sqlalchemy.ext.asyncio import AsyncSession
from core.database import get_session
from typing import Optional
from pydantic import BaseModel

class InterestUpdate(BaseModel):
    interest: int

router = APIRouter(prefix="/schedules", tags=["schedules"])

@router.get("/")
async def read_schedules(
    active_lines_only: Optional[bool] = Query(False, description="Show only schedules from active lines"),
    session: AsyncSession = Depends(get_session)
):
    if active_lines_only:
        return await schedule_repo.get_active_schedules(session)
    return await schedule_repo.get_all_schedules(session)


@router.post("/create")
async def create_schedule(schedule: schedule_model.ScheduleCreate, session: AsyncSession = Depends(get_session)):
    return await schedule_repo.create_schedule(schedule, session)

@router.post("/{schedule_id}/interest")
async def update_interest(schedule_id: int, session: AsyncSession = Depends(get_session)):
    return await schedule_repo.update_interest(schedule_id, session)


@router.get("/{schedule_id}")
async def read_schedule(schedule_id: int, session: AsyncSession = Depends(get_session)):
    return await schedule_repo.get_schedule(schedule_id, session)

@router.delete("/{schedule_id}")
async def delete_schedule(schedule_id: int, session: AsyncSession = Depends(get_session)):
    return await schedule_repo.delete_schedule(schedule_id, session)







