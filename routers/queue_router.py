from fastapi import APIRouter
from repository import queue_repo
from models import queue_model
from core.database import SessionDep

router = APIRouter(prefix="/queue", tags=["queue"])

@router.get("/", response_model=list[queue_model.Queue])
def read_queues(session: SessionDep):
    return queue_repo.get_all_queues(session)

@router.get("/{queue_id}", response_model=queue_model.Queue)
def read_queue(queue_id: int, session: SessionDep):
    return queue_repo.get_queue_by_id(session, queue_id)

@router.post("/", response_model=queue_model.Queue)
def create_queue(queue: queue_model.Queue, session: SessionDep):
    return queue_repo.create_queue(session, queue)


@router.put("/{queue_id}", response_model=queue_model.Queue)
def update_queue(queue_id: int, queue: queue_model.Queue, session: SessionDep):
    return queue_repo.update_queue(session, queue_id, queue)


@router.delete("/{queue_id}", response_model=dict)
def delete_queue(queue_id: int, session: SessionDep):
    return queue_repo.delete_queue(session, queue_id)


@router.get("/bus/{bus_prefix}", response_model=list[queue_model.Queue])
def read_queues_by_bus_prefix(bus_prefix: str, session: SessionDep):
    return queue_repo.get_queues_by_bus_prefix(session, bus_prefix)


@router.get("/status/{status}", response_model=list[queue_model.Queue])
def read_queues_by_status(status: queue_model.StatusEnum, session: SessionDep):
    return queue_repo.get_queues_by_status(session, status)