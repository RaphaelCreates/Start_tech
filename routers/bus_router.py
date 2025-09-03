from fastapi import APIRouter
from repository import bus_repo
from models import bus_model
from core.database import SessionDep

router = APIRouter(prefix="/bus", tags=["bus"])

@router.get("/", response_model=list[bus_model.Bus])
def read_buses(session: SessionDep):
    return bus_repo.get_all_buses(session)


@router.get("/{bus_prefix}", response_model=bus_model.Bus)
def read_bus(bus_prefix: str, session: SessionDep):
    return bus_repo.get_bus_by_prefix(session, bus_prefix)


@router.post("/", response_model=bus_model.Bus)
def create_bus(bus: bus_model.Bus, session: SessionDep):
    return bus_repo.create_bus(session, bus)


@router.put("/{bus_prefix}", response_model=bus_model.Bus)
def update_bus(bus_prefix: str, bus: bus_model.Bus, session: SessionDep):
    return bus_repo.update_bus(session, bus_prefix, bus)


@router.delete("/{bus_prefix}", response_model=dict)
def delete_bus(bus_prefix: str, session: SessionDep):
    return bus_repo.delete_bus(session, bus_prefix)
