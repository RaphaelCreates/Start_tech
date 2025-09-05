from fastapi import status, APIRouter, Depends
from core.database import SessionDep
from repository import login_repo
from models import login_model
from core import oauth2

router = APIRouter(prefix="/user", tags=["User"])

@router.post("/", response_model=login_model.User, status_code=status.HTTP_201_CREATED)
def create_user(request: login_model.User, db: SessionDep):
    return login_repo.create_user(db, request.name, request.totvs_id, request.password)

@router.get("/{totvs_id}", response_model=login_model.User) 
def get_user_by_id(totvs_id: str, db: SessionDep, current_user: login_model.User = Depends(oauth2.get_current_user)):
    return login_repo.get_user_by_id(db, totvs_id)
        
@router.get("/", response_model=list[login_model.User])
def get_all_users(db: SessionDep, current_user: login_model.User = Depends(oauth2.get_current_user)):
    return login_repo.get_all_users(db)

@router.delete("/{totvs_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_user(totvs_id: str, db: SessionDep, current_user: login_model.User = Depends(oauth2.get_current_user)):
    return login_repo.delete_user(db, totvs_id)

@router.patch("/", response_model=login_model.User)
def update_user(request: login_model.User, db: SessionDep, current_user: login_model.User = Depends(oauth2.get_current_user)):
    return login_repo.update_user(current_user.totvs_id, db, request)