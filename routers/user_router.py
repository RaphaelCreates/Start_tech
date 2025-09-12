from fastapi import status, APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession
from core.database import get_session
from repository import user_repo
from models import user_model
from core import oauth2

router = APIRouter(prefix="/user", tags=["User"])

@router.post("/", response_model=user_model.User, status_code=status.HTTP_201_CREATED)
async def create_user(request: user_model.User, db: AsyncSession = Depends(get_session)):
    return await user_repo.create_user(db, request.name, request.totvs_id, request.password)

@router.get("/{totvs_id}", response_model=user_model.User) 
async def get_user_by_id(totvs_id: str, db: AsyncSession = Depends(get_session), current_user: user_model.User = Depends(oauth2.get_current_user)):
    return await user_repo.get_user_by_id(db, totvs_id)
        
@router.get("/", response_model=list[user_model.User])
async def get_all_users(db: AsyncSession = Depends(get_session), current_user: user_model.User = Depends(oauth2.get_current_user)):
    return await user_repo.get_all_users(db)

@router.delete("/{totvs_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_user(totvs_id: str, db: AsyncSession = Depends(get_session), current_user: user_model.User = Depends(oauth2.get_current_user)):
    return await user_repo.delete_user(db, totvs_id)

@router.patch("/", response_model=user_model.User)
async def update_user(request: user_model.User, db: AsyncSession = Depends(get_session), current_user: user_model.User = Depends(oauth2.get_current_user)):
    return await user_repo.update_user(current_user.totvs_id, db, request)