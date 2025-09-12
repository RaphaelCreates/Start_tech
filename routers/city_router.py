from fastapi import APIRouter, Depends
from repository import city_repo
from models import schedule_model
from sqlalchemy.ext.asyncio import AsyncSession
from core.database import get_session

router = APIRouter(prefix="/city", tags=["city"])

@router.get("/")
async def read_cities(session: AsyncSession = Depends(get_session)):
    return await city_repo.get_all_cities(session)


@router.post("/")
async def create_city(city: schedule_model.City, session: AsyncSession = Depends(get_session)):
    return await city_repo.create_city(city, session)


@router.get("/{city_id}")
async def read_city(city_id: int, session: AsyncSession = Depends(get_session)):
    return await city_repo.get_city(city_id, session)


@router.put("/{city_id}")
async def update_city(city_id: int, city: schedule_model.City, session: AsyncSession = Depends(get_session)):
    return await city_repo.update_city(city_id, city, session)


@router.delete("/{city_id}")
async def delete_city(city_id: int, session: AsyncSession = Depends(get_session)):
    return await city_repo.delete_city(city_id, session)
