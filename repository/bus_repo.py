from fastapi import HTTPException
from sqlmodel import select
from core.database import SessionDep
from models import bus_model

def get_all_buses(session: SessionDep):
    statement = select(bus_model.Bus)
    results = session.exec(statement)
    return results.all()


def get_bus_by_prefix(session: SessionDep, bus_prefix: str):
    statement = select(bus_model.Bus).where(bus_model.Bus.prefix == bus_prefix)
    result = session.exec(statement)
    bus = result.one_or_none()
    if not bus:
        raise HTTPException(status_code=404, detail="Bus not found")
    return bus


def create_bus(session: SessionDep, bus: bus_model.Bus):
    session.add(bus)
    session.commit()
    session.refresh(bus)
    return bus


def update_bus(session: SessionDep, bus_prefix: str, updated_bus: bus_model.Bus):
    statement = select(bus_model.Bus).where(bus_model.Bus.prefix == bus_prefix)
    result = session.exec(statement)
    bus = result.one_or_none()
    if not bus:
        raise HTTPException(status_code=404, detail="Bus not found")
    bus_data = updated_bus.dict(exclude_unset=True)
    for key, value in bus_data.items():
        setattr(bus, key, value)
    session.add(bus)
    session.commit()
    session.refresh(bus)
    return bus


def delete_bus(session: SessionDep, bus_prefix: str):
    statement = select(bus_model.Bus).where(bus_model.Bus.prefix == bus_prefix)
    result = session.exec(statement)
    bus = result.one_or_none()
    if not bus:
        raise HTTPException(status_code=404, detail="Bus not found")
    session.delete(bus)
    session.commit()
    return {"detail": "Bus deleted successfully"}
