from fastapi import APIRouter, status
from repository import login_repo
from schemas import login_schema
from utils.database import SessionDep

router = APIRouter(prefix="/auth", tags=["auth"])

@router.post("/login", status_code=status.HTTP_200_OK)
def login_request(request: login_schema.LoginRequest, db: SessionDep):
    return login_repo.login_request(request, db)

@router.post("/create_user", status_code=status.HTTP_201_CREATED)
def create_user(request: login_schema.LoginRequest, db: SessionDep):
    return login_repo.create_user(request, db)