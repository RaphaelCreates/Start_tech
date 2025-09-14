from fastapi import HTTPException
from sqlmodel import select
from sqlalchemy.ext.asyncio import AsyncSession
from models import bus_model

async def get_all_buses(session: AsyncSession):
    statement = select(bus_model.Bus)
    results = await session.execute(statement)
    return results.scalars().all()


async def create_bus(session: AsyncSession, bus: bus_model.Bus):
    session.add(bus)
    await session.commit()
    await session.refresh(bus)
    return bus

async def get_bus_by_prefix(session: AsyncSession, bus_prefix: int):
    statement = select(bus_model.Bus).where(bus_model.Bus.prefix == bus_prefix)
    result = await session.execute(statement)
    bus = result.scalars().one_or_none()
    if not bus:
        raise HTTPException(status_code=404, detail="Bus not found")
    return bus

async def get_bus_by_prefix_or_create(bus_prefix: int, bus: bus_model.BusBase, session: AsyncSession):
    if not bus.capacity:
        raise HTTPException(status_code=422, detail="Capacity is required when creating a new bus")
    statement = select(bus_model.Bus).where(bus_model.Bus.prefix == bus_prefix)
    result = await session.execute(statement)
    existing_bus = result.scalars().one_or_none()
    if not existing_bus:
        new_bus = bus_model.Bus(prefix=bus_prefix, capacity=bus.capacity, occupied=bus.occupied)
        return await create_bus(session, new_bus)
    return existing_bus


async def update_bus(session: AsyncSession, bus_prefix: int, updated_bus: bus_model.Bus):
    statement = select(bus_model.Bus).where(bus_model.Bus.prefix == bus_prefix)
    result = await session.execute(statement)
    bus = result.scalars().one_or_none()
    if not bus:
        raise HTTPException(status_code=404, detail="Bus not found")
    bus_data = updated_bus.dict(exclude_unset=True)
    for key, value in bus_data.items():
        setattr(bus, key, value)
    session.add(bus)
    await session.commit()
    await session.refresh(bus)
    return bus


async def delete_bus(session: AsyncSession, bus_prefix: int):
    statement = select(bus_model.Bus).where(bus_model.Bus.prefix == bus_prefix)
    result = await session.execute(statement)
    bus = result.scalars().one_or_none()
    if not bus:
        raise HTTPException(status_code=404, detail="Bus not found")
    await session.delete(bus)
    await session.commit()
    return {"detail": "Bus deleted successfully"}
    session.commit()
    return {"detail": "Bus deleted successfully"}


async def update_bus_occupancy(session: AsyncSession, bus_prefix: int, occupied: int):
    """Atualiza a ocupação de um ônibus específico"""
    bus = await get_bus_by_prefix(session, bus_prefix)
    
    if occupied < 0:
        raise HTTPException(status_code=400, detail="Occupied seats cannot be negative")
    if occupied > bus.capacity:
        raise HTTPException(status_code=400, detail=f"Occupied seats ({occupied}) cannot exceed capacity ({bus.capacity})")

    bus.occupied += 1
    session.add(bus)
    await session.commit()
    await session.refresh(bus)
    return bus


async def get_bus_occupancy_info(session: AsyncSession, bus_prefix: int) -> bus_model.BusOccupancyInfo:
    """Retorna informações detalhadas sobre a ocupação de um ônibus"""
    bus = await get_bus_by_prefix(session, bus_prefix)
    
    available_seats = bus.capacity - bus.occupied
    occupancy_percentage = (bus.occupied / bus.capacity) * 100 if bus.capacity > 0 else 0
    is_full = bus.occupied >= bus.capacity
    
    return bus_model.BusOccupancyInfo(
        prefix=bus.prefix,
        capacity=bus.capacity,
        occupied=bus.occupied,
        available_seats=available_seats,
        occupancy_percentage=round(occupancy_percentage, 2),
        is_full=is_full
    )


async def get_buses_by_occupancy_status(session: AsyncSession, is_full: bool = None):
    """Lista ônibus por status de ocupação"""
    statement = select(bus_model.Bus)
    result = await session.execute(statement)
    buses = result.scalars().all()
    
    if is_full is None:
        return buses
    
    filtered_buses = []
    for bus in buses:
        bus_is_full = bus.occupied >= bus.capacity
        if is_full == bus_is_full:
            filtered_buses.append(bus)
    
    return filtered_buses


async def assign_bus_to_line(session: AsyncSession, bus_prefix: int, line_id: int):
    bus = await get_bus_by_prefix(session, bus_prefix)
    
    # Verificar se a linha existe
    from models.schedule_model import Line
    line_statement = select(Line).where(Line.id == line_id)
    result = await session.execute(line_statement)
    line = result.scalars().one_or_none()
    if not line:
        raise HTTPException(status_code=404, detail="Line not found")
    
    bus.active_line_id = line_id
    session.add(bus)
    await session.commit()
    await session.refresh(bus)
    return bus


async def unassign_bus_from_line(session: AsyncSession, bus_prefix: int):
    bus = await get_bus_by_prefix(session, bus_prefix)
    bus.active_line_id = None
    bus.occupied = 0
    session.add(bus)
    await session.commit()
    await session.refresh(bus)
    return bus


async def get_buses_by_line(session: AsyncSession, line_id: int):
    statement = select(bus_model.Bus).where(bus_model.Bus.active_line_id == line_id)
    result = await session.execute(statement)
    return result.scalars().all()
