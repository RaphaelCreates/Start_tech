from fastapi import HTTPException
from sqlmodel import select
from sqlalchemy.ext.asyncio import AsyncSession
from models import schedule_model
from models.schedule_model import Line
from datetime import datetime, timedelta


async def create_schedule(schedule: schedule_model.ScheduleCreate, session: AsyncSession):
    new_schedule = schedule_model.Schedule(
        line_id=schedule.line_id,
        arrival_time=schedule.arrival_time,
        departure_time=schedule.departure_time,
        day_week=schedule.day_week,
        interest=0
    )
    session.add(new_schedule)
    await session.commit()
    await session.refresh(new_schedule)
    return new_schedule


async def get_schedule(schedule_id: int, session: AsyncSession):
    result = await session.execute(select(schedule_model.Schedule).where(schedule_model.Schedule.id == schedule_id))
    schedule = result.scalars().first()
    if not schedule:
        raise HTTPException(status_code=404, detail="Schedule not found")
    return schedule


async def get_all_schedules(session: AsyncSession):
    result = await session.execute(select(schedule_model.Schedule))
    schedules = result.scalars().all()
    if not schedules:
        raise HTTPException(status_code=404, detail="No schedules found")
    return schedules


async def get_active_schedules(session: AsyncSession):
    """Retorna apenas schedules de linhas ativas"""
    result = await session.execute(
        select(schedule_model.Schedule)
        .join(Line)
        .where(Line.active == True)
    )
    schedules = result.scalars().all()
    if not schedules:
        raise HTTPException(status_code=404, detail="No active schedules found")
    return schedules


async def update_schedule(schedule_id: int, request: schedule_model.Schedule, session: AsyncSession):
    result = await session.execute(select(schedule_model.Schedule).where(schedule_model.Schedule.id == schedule_id))
    db_schedule = result.scalars().first()
    if not db_schedule:
        raise HTTPException(status_code=404, detail="Schedule not found")
    schedule_data = request.model_dump(exclude_unset=True)
    db_schedule.sqlmodel_update(schedule_data)
    session.add(db_schedule)
    await session.commit()
    await session.refresh(db_schedule)
    return db_schedule



async def update_interest(schedule_id: int, session: AsyncSession):
    result = await session.execute(select(schedule_model.Schedule).where(schedule_model.Schedule.id == schedule_id))
    db_schedule = result.scalars().first()
    if not db_schedule:
        raise HTTPException(status_code=404, detail="Schedule not found")
    db_schedule.interest += 1
    session.add(db_schedule)
    await session.commit()
    await session.refresh(db_schedule)
    return db_schedule



async def delete_schedule(schedule_id: int, session: AsyncSession):
    result = await session.execute(select(schedule_model.Schedule).where(schedule_model.Schedule.id == schedule_id))
    existing_schedule = result.scalars().first()
    if not existing_schedule:
        raise HTTPException(status_code=404, detail="Schedule not found")
    await session.delete(existing_schedule)
    await session.commit()
    return {"detail": "Schedule deleted successfully"}



async def update_schedule_interest(schedule_id: int, interest_value: int, session: AsyncSession):
    result = await session.execute(select(schedule_model.Schedule).where(schedule_model.Schedule.id == schedule_id))
    db_schedule = result.scalars().first()
    if not db_schedule:
        raise HTTPException(status_code=404, detail="Schedule not found")
    db_schedule.interest = interest_value
    session.add(db_schedule)
    await session.commit()
    await session.refresh(db_schedule)
    return db_schedule


