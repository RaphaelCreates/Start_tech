

from fastapi import APIRouter, Depends, status
from repository import login_repo
from schemas import login_schema
from utils.database import SessionDep
# A importação deve ser feita de forma absoluta
from repository.token_service import validate_access_token

router = APIRouter(prefix="/auth", tags=["auth"])

@router.post("/login", status_code=status.HTTP_200_OK)
def login_request(request: login_schema.LoginRequest, db: SessionDep):
    return login_repo.login_request(request, db)

@router.post("/create_user", status_code=status.HTTP_201_CREATED)
def create_user(request: login_schema.LoginRequest, db: SessionDep):
    return login_repo.create_user(request, db)

@router.get("/protected-route")
def get_protected_data(username: str = Depends(validate_access_token)):
    return {"message": f"Bem-vindo, {username}. Esta rota é protegida!"}