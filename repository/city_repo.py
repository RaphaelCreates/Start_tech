from fastapi import HTTPException
from sqlmodel import select
from sqlalchemy.ext.asyncio import AsyncSession
from models import schedule_model

async def create_city(city: schedule_model.City, session: AsyncSession):
    result = await session.execute(select(schedule_model.City).where(schedule_model.City.name == city.name))
    existing_city = result.scalars().first()
    if existing_city:
        raise HTTPException(status_code=400, detail="City already exists")
    new_city = schedule_model.City(name=city.name, state=city.state, country=city.country)
    session.add(new_city)
    await session.commit()
    await session.refresh(new_city)
    return new_city


async def get_city(city_id: int, session: AsyncSession):
    result = await session.execute(select(schedule_model.City).where(schedule_model.City.id == city_id))
    city = result.scalars().first()
    if not city:
        raise HTTPException(status_code=404, detail="City not found")
    return city


async def get_all_cities(session: AsyncSession):
    result = await session.execute(select(schedule_model.City))
    cities = result.scalars().all()
    if not cities:
        raise HTTPException(status_code=404, detail="No cities found")
    return cities


async def update_city(city_id: int, city: schedule_model.City, session: AsyncSession):
    result = await session.execute(select(schedule_model.City).where(schedule_model.City.id == city_id))
    existing_city = result.scalars().first()
    if not existing_city:
        raise HTTPException(status_code=404, detail="City not found")
    existing_city.state = city.state
    existing_city.country = city.country
    session.add(existing_city)
    await session.commit()
    await session.refresh(existing_city)
    return existing_city


async def delete_city(city_id: int, session: AsyncSession):
    result = await session.execute(select(schedule_model.City).where(schedule_model.City.id == city_id))
    existing_city = result.scalars().first()
    if not existing_city:
        raise HTTPException(status_code=404, detail="City not found")
    await session.delete(existing_city)
    await session.commit()
    return {"detail": "City deleted successfully"}


async def get_city_lines(city_id: int, session: AsyncSession) -> list[schedule_model.Line]:
    result = await session.execute(select(schedule_model.City).where(schedule_model.City.id == city_id))
    city = result.scalars().first()
    if not city:
        raise HTTPException(status_code=404, detail="City not found")
    return city.lines
