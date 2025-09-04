from fastapi import APIRouter
from repository import trip_repo
from models import trip_model
from core.database import SessionDep

router = APIRouter(prefix="/trip", tags=["trip"])

@router.get("/", response_model=list[trip_model.TripReport])
def read_trips(session: SessionDep):
    return trip_repo.get_all_trips(session)


@router.get("/trips/{schedule_id}/status")
def read_trip_status(schedule_id: int, session: SessionDep):
    return trip_repo.get_trip_status(schedule_id, session)


@router.get("/{trip_id}", response_model=trip_model.TripReport)
def read_trip(trip_id: int, session: SessionDep):
    return trip_repo.get_trip_by_id(session, trip_id)

@router.post("/", response_model=trip_model.TripReport)
def create_trip(trip: trip_model.TripReport, session: SessionDep):
    return trip_repo.create_trip(session, trip)


@router.patch("/{trip_id}", response_model=trip_model.TripReport)
def update_trip(trip_id: int, trip: trip_model.TripReport, session: SessionDep):
    return trip_repo.update_trip(session, trip_id, trip)


@router.delete("/{trip_id}", response_model=dict)
def delete_trip(trip_id: int, session: SessionDep):
    return trip_repo.delete_trip(session, trip_id)



