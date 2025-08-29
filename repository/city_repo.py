from fastapi import HTTPException
from sqlmodel import select
from core.database import SessionDep
from models import schedule_model

def create_city(city: schedule_model.City, session: SessionDep):
    existing_city = session.exec(select(schedule_model.City).where(schedule_model.City.name == city.name)).first()
    if existing_city:
        raise HTTPException(status_code=400, detail="City already exists")
    new_city = schedule_model.City(name=city.name, state=city.state, country=city.country)
    session.add(new_city)
    session.commit()
    session.refresh(new_city)
    return new_city


def get_city(city_id: int, session: SessionDep):
    city = session.exec(select(schedule_model.City).where(schedule_model.City.id == city_id)).first()
    if not city:
        raise HTTPException(status_code=404, detail="City not found")
    return city


def get_all_cities(session: SessionDep):
    cities = session.exec(select(schedule_model.City)).all()
    if not cities:
        raise HTTPException(status_code=404, detail="No cities found")
    return cities


def update_city(city_id: int, city: schedule_model.City, session: SessionDep):
    existing_city = session.exec(select(schedule_model.City).where(schedule_model.City.id == city_id)).first()
    if not existing_city:
        raise HTTPException(status_code=404, detail="City not found")
    existing_city.name = city.name
    existing_city.state = city.state
    existing_city.country = city.country
    session.add(existing_city)
    session.commit()
    session.refresh(existing_city)
    return existing_city


def delete_city(city_id: int, session: SessionDep):
    existing_city = session.exec(select(schedule_model.City).where(schedule_model.City.id == city_id)).first()
    if not existing_city:
        raise HTTPException(status_code=404, detail="City not found")
    session.delete(existing_city)
    session.commit()
    return {"detail": "City deleted successfully"}
