from fastapi import HTTPException
from sqlmodel import select
from sqlalchemy.orm import selectinload
from sqlalchemy import asc
from sqlalchemy.ext.asyncio import AsyncSession
from models import schedule_model
from models.schedule_model import Line, LineRead, City, Schedule

async def create_line(line: schedule_model.Line, session: AsyncSession):
    result = await session.execute(select(schedule_model.Line).where(schedule_model.Line.name == line.name))
    existing = result.scalars().first()
    if existing:
        raise HTTPException(status_code=400, detail="Line already exists.")
    session.add(line)
    await session.commit()
    await session.refresh(line)
    return line

async def get_line(line_id: int, session: AsyncSession):
    result = await session.execute(select(schedule_model.Line).where(schedule_model.Line.id == line_id))
    line = result.scalars().first()
    if not line:
        raise HTTPException(status_code=404, detail="Line not found")
    return line

async def get_all_lines(session: AsyncSession) -> list[LineRead]:
    result = await session.execute(
        select(Line).options(selectinload(Line.schedules))
    )
    lines = result.scalars().all()
    return [LineRead.model_validate(line) for line in lines]

async def get_lines_by_state(state: str, session: AsyncSession) -> list[LineRead]:
    result = await session.execute(
        select(Line)
        .join(City)
        .where(City.state == state.upper())
        .options(selectinload(Line.schedules))
    )
    lines = result.scalars().all()
    return [LineRead.model_validate(line) for line in lines]

async def get_active_lines(session: AsyncSession) -> list[LineRead]:
    result = await session.execute(
        select(Line)
        .where(Line.active == True)
        .options(selectinload(Line.schedules))
    )
    lines = result.scalars().all()
    return [LineRead.model_validate(line) for line in lines]

async def update_line(line_id: int, line: schedule_model.Line, session: AsyncSession):
    result = await session.execute(select(schedule_model.Line).where(schedule_model.Line.id == line_id))
    existing = result.scalars().first()
    if not existing:
        raise HTTPException(status_code=404, detail="Line not found")
    existing.name = line.name
    existing.active_bus = line.active_bus
    existing.active = line.active
    await session.commit()
    await session.refresh(existing)
    return existing

async def delete_line(line_id: int, session: AsyncSession):
    result = await session.execute(select(schedule_model.Line).where(schedule_model.Line.id == line_id))
    existing = result.scalars().first()
    if not existing:
        raise HTTPException(status_code=404, detail="Line not found")
    await session.delete(existing)
    await session.commit()
    return {"detail": "Line deleted successfully"}

async def get_line_schedules(line_id: int, session: AsyncSession) -> list[schedule_model.ScheduleRead]:
    result = await session.execute(
        select(Line).options(selectinload(Line.schedules)).where(Line.id == line_id)
    )
    line = result.scalars().first()
    if not line:
        raise HTTPException(status_code=404, detail="Line not found")
    return [schedule_model.ScheduleRead.model_validate(s) for s in line.schedules]

async def get_line_status(line_id: int, session: AsyncSession) -> dict:
    result = await session.execute(select(schedule_model.Line).where(schedule_model.Line.id == line_id))
    line = result.scalars().first()
    if not line:
            raise HTTPException(status_code=404, detail="Line not found")
    return {"line_id": line.id, "name": line.name, "active": line.active}

async def update_line_status(line_id: int, active: bool, session: AsyncSession):
    result = await session.execute(select(schedule_model.Line).where(schedule_model.Line.id == line_id))
    line = result.scalars().first()
    if not line:
        raise HTTPException(status_code=404, detail="Line not found")
    line.active = active
    session.add(line)
    await session.commit()
    await session.refresh(line)
    return line