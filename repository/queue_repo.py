from fastapi import HTTPException
from sqlmodel import select
from core.database import SessionDep
from models import queue_model
import redis


def get_all_queues(session: SessionDep):
    statement = select(queue_model.Queue)
    results = session.exec(statement)
    return results.all()

def get_queue_by_id(session: SessionDep, queue_id: int):
    statement = select(queue_model.Queue).where(queue_model.Queue.id == queue_id)
    result = session.exec(statement)
    queue = result.one_or_none()
    if not queue:
        raise HTTPException(status_code=404, detail="Queue not found")
    return queue

def create_queue(session: SessionDep, queue: queue_model.Queue):
    session.add(queue)
    session.commit()
    session.refresh(queue)
    return queue

def update_queue(session: SessionDep, queue_id: int, updated_queue: queue_model.Queue):
    statement = select(queue_model.Queue).where(queue_model.Queue.id == queue_id)
    result = session.exec(statement)
    queue = result.one_or_none()
    if not queue:
        raise HTTPException(status_code=404, detail="Queue not found")
    queue_data = updated_queue.dict(exclude_unset=True)
    for key, value in queue_data.items():
        setattr(queue, key, value)
    session.add(queue)
    session.commit()
    session.refresh(queue)
    return queue

def delete_queue(session: SessionDep, queue_id: int):
    statement = select(queue_model.Queue).where(queue_model.Queue.id == queue_id)
    result = session.exec(statement)
    queue = result.one_or_none()
    if not queue:
        raise HTTPException(status_code=404, detail="Queue not found")
    session.delete(queue)
    session.commit()
    return {"detail": "Queue deleted successfully"}


def get_queues_by_bus_prefix(session: SessionDep, bus_prefix: str):
    statement = select(queue_model.Queue).where(queue_model.Queue.bus_prefix == bus_prefix)
    result = session.exec(statement)
    return result.all()

def get_queues_by_status(session: SessionDep, status: queue_model.StatusEnum):
    statement = select(queue_model.Queue).where(queue_model.Queue.status == status)
    result = session.exec(statement)
    return result.all()


