from fastapi import HTTPException
from sqlmodel import select
from core.database import SessionDep
from models import trip_model
import requests


def get_all_trips(session: SessionDep):
    statement = select(trip_model.TripReport)
    results = session.exec(statement)
    return results.all()

def get_trip_by_id(session: SessionDep, trip_id: int):
    statement = select(trip_model.TripReport).where(trip_model.TripReport.id == trip_id)
    result = session.exec(statement)
    trip = result.one_or_none()
    if not trip:
        raise HTTPException(status_code=404, detail="Trip not found")
    return trip

def create_trip(session: SessionDep, schedule_id: int):
    trip = trip_model.TripReport(external_schedule_id=schedule_id)
    session.add(trip)
    session.commit()
    session.refresh(trip)
    return trip

def update_trip(session: SessionDep, trip_id: int, updated_trip: trip_model.TripReport):
    trip = session.get(trip_model.TripReport, trip_id)
    if not trip:
        raise HTTPException(status_code=404, detail="Trip not found")
    trip_data = updated_trip.model_dump(exclude_unset=True)
    trip.sqlmodel_update(trip_data)
    session.add(trip)
    session.commit()
    session.refresh(trip)
    return trip

def delete_trip(session: SessionDep, trip_id: int):
    statement = select(trip_model.TripReport).where(trip_model.TripReport.id == trip_id)
    result = session.exec(statement)
    trip = result.one_or_none()
    if not trip:
        raise HTTPException(status_code=404, detail="Trip not found")
    session.delete(trip)
    session.commit()
    return {"detail": "Trip deleted successfully"}


def get_trip_status(schedule_id: int, session: SessionDep):
    trip = session.exec(
        select(trip_model.TripReport).where(trip_model.TripReport.external_schedule_id == schedule_id)
    ).first()
    if not trip:
        return {"status": None}  
    return {"status": trip.status}