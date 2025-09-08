from fastapi import HTTPException
from sqlmodel import select
from core.database import SessionDep
from models import bus_model

def get_all_buses(session: SessionDep):
    statement = select(bus_model.Bus)
    results = session.exec(statement)
    return results.all()


def create_bus(session: SessionDep, bus: bus_model.Bus):
    session.add(bus)
    session.commit()
    session.refresh(bus)
    return bus

def get_bus_by_prefix(session: SessionDep, bus_prefix: int):
    statement = select(bus_model.Bus).where(bus_model.Bus.prefix == bus_prefix)
    result = session.exec(statement)
    bus = result.one_or_none()
    if not bus:
        raise HTTPException(status_code=404, detail="Bus not found")
    return bus

def get_bus_by_prefix_or_create(bus_prefix: int, bus: bus_model.Bus, session: SessionDep):
    statement = select(bus_model.Bus).where(bus_model.Bus.prefix == bus_prefix)
    result = session.exec(statement)
    existing_bus = result.one_or_none()
    if not existing_bus:
        new_bus = bus_model.Bus(prefix=bus_prefix, capacity=bus.capacity, ocupied=bus.ocupied)
        return create_bus(session, new_bus)
    return existing_bus


def update_bus(session: SessionDep, bus_prefix: int, updated_bus: bus_model.Bus):
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


def delete_bus(session: SessionDep, bus_prefix: int):
    statement = select(bus_model.Bus).where(bus_model.Bus.prefix == bus_prefix)
    result = session.exec(statement)
    bus = result.one_or_none()
    if not bus:
        raise HTTPException(status_code=404, detail="Bus not found")
    session.delete(bus)
    session.commit()
    return {"detail": "Bus deleted successfully"}


def update_bus_occupancy(session: SessionDep, bus_prefix: int, ocupied: int):
    """Atualiza a ocupação de um ônibus específico"""
    bus = get_bus_by_prefix(session, bus_prefix)
    
    if ocupied < 0:
        raise HTTPException(status_code=400, detail="Occupied seats cannot be negative")
    if ocupied > bus.capacity:
        raise HTTPException(status_code=400, detail=f"Occupied seats ({ocupied}) cannot exceed capacity ({bus.capacity})")
    
    bus.ocupied = ocupied
    session.add(bus)
    session.commit()
    session.refresh(bus)
    return bus


def get_bus_occupancy_info(session: SessionDep, bus_prefix: int) -> bus_model.BusOccupancyInfo:
    """Retorna informações detalhadas sobre a ocupação de um ônibus"""
    bus = get_bus_by_prefix(session, bus_prefix)
    
    available_seats = bus.capacity - bus.ocupied
    occupancy_percentage = (bus.ocupied / bus.capacity) * 100 if bus.capacity > 0 else 0
    is_full = bus.ocupied >= bus.capacity
    
    return bus_model.BusOccupancyInfo(
        prefix=bus.prefix,
        capacity=bus.capacity,
        ocupied=bus.ocupied,
        available_seats=available_seats,
        occupancy_percentage=round(occupancy_percentage, 2),
        is_full=is_full
    )


def get_buses_by_occupancy_status(session: SessionDep, is_full: bool = None):
    """Lista ônibus por status de ocupação"""
    statement = select(bus_model.Bus)
    buses = session.exec(statement).all()
    
    if is_full is None:
        return buses
    
    filtered_buses = []
    for bus in buses:
        bus_is_full = bus.ocupied >= bus.capacity
        if is_full == bus_is_full:
            filtered_buses.append(bus)
    
    return filtered_buses
