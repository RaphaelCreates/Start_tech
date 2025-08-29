from fastapi import APIRouter
from repository import line_repo
from models import schedule_model
from core.database import SessionDep

router = APIRouter(prefix="/lines", tags=["lines"])

@router.get("/")
def read_lines(session: SessionDep):
    return line_repo.get_all_lines(session)


@router.post("/")
def create_line(line: schedule_model.Line, session: SessionDep):
    return line_repo.create_line(line, session)


@router.get("/{line_id}")
def read_line(line_id: int, session: SessionDep):
    return line_repo.get_line(line_id, session)


@router.put("/{line_id}")
def update_line(line_id: int, line: schedule_model.Line, session: SessionDep):
    return line_repo.update_line(line_id, line, session)


@router.delete("/{line_id}")
def delete_line(line_id: int, session: SessionDep):
    return line_repo.delete_line(line_id, session)