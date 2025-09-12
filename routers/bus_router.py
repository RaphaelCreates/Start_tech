from fastapi import APIRouter, Query, Depends
from repository import bus_repo
from models import bus_model
from sqlalchemy.ext.asyncio import AsyncSession
from core.database import get_session
from typing import Optional

router = APIRouter(prefix="/bus", tags=["bus"])

@router.get("/", response_model=list[bus_model.Bus])
async def read_buses(
    is_full: Optional[bool] = Query(None, description="Filter buses by occupancy status"), 
    session: AsyncSession = Depends(get_session)
):
    if is_full is not None:
        return await bus_repo.get_buses_by_occupancy_status(session, is_full)
    return await bus_repo.get_all_buses(session)

@router.get("/{bus_prefix}", response_model=bus_model.Bus)
async def read_bus(bus_prefix: int, session: AsyncSession = Depends(get_session)):
    return await bus_repo.get_bus_by_prefix(session, bus_prefix)

@router.post("/{bus_prefix:int}", response_model=bus_model.Bus)
async def create_or_read_bus(bus_prefix: int, bus_data: dict, session: AsyncSession = Depends(get_session)):
    bus = bus_model.BusBase(prefix=bus_prefix, capacity=bus_data.get("capacity"))
    return await bus_repo.get_bus_by_prefix_or_create(bus_prefix, bus, session)


@router.patch("/{bus_prefix}", response_model=bus_model.Bus)
async def update_bus(bus_prefix: int, bus: bus_model.Bus, session: AsyncSession = Depends(get_session)):
    return await bus_repo.update_bus(session, bus_prefix, bus)


@router.delete("/{bus_prefix}", response_model=dict)
async def delete_bus(bus_prefix: int, session: AsyncSession = Depends(get_session)):
    return await bus_repo.delete_bus(session, bus_prefix)


@router.get("/{bus_prefix}/occupancy", response_model=bus_model.BusOccupancyInfo)
async def get_bus_occupancy(bus_prefix: int, session: AsyncSession = Depends(get_session)):
    return await bus_repo.get_bus_occupancy_info(session, bus_prefix)


@router.patch("/{bus_prefix}/occupancy", response_model=bus_model.Bus)
async def update_bus_occupancy(bus_prefix: int, occupancy_update: bus_model.BusOccupancyUpdate, session: AsyncSession = Depends(get_session)):
    return await bus_repo.update_bus_occupancy(session, bus_prefix, occupancy_update.occupied)


@router.patch("/{bus_prefix}/assign-line/{line_id}", response_model=bus_model.Bus)
async def assign_bus_to_line(bus_prefix: int, line_id: int, session: AsyncSession = Depends(get_session)):
    return await bus_repo.assign_bus_to_line(session, bus_prefix, line_id)


@router.patch("/{bus_prefix}/unassign-line", response_model=bus_model.Bus)
async def unassign_bus_from_line(bus_prefix: int, session: AsyncSession = Depends(get_session)):
    return await bus_repo.unassign_bus_from_line(session, bus_prefix)
