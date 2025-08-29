from fastapi import APIRouter
from repository import city_repo
from models import schedule_model
from core.database import SessionDep

router = APIRouter(prefix="/city", tags=["city"])

@router.get("/")
def read_cities(session: SessionDep):
    return city_repo.get_all_cities(session)


@router.post("/")
def create_city(city: schedule_model.City, session: SessionDep):
    return city_repo.create_city(city, session)


@router.get("/{city_id}")
def read_city(city_id: int, session: SessionDep):
    return city_repo.get_city(city_id, session)


@router.put("/{city_id}")
def update_city(city_id: int, city: schedule_model.City, session: SessionDep):
    return city_repo.update_city(city_id, city, session)


@router.delete("/{city_id}")
def delete_city(city_id: int, session: SessionDep):
    return city_repo.delete_city(city_id, session)
