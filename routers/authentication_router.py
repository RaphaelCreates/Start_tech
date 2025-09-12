from fastapi import APIRouter, status, HTTPException, Depends
from fastapi.security import OAuth2PasswordRequestForm
from typing import Annotated
from schemas import jwt_schema
from repository import jwt_repo
from datetime import timedelta
from sqlalchemy.ext.asyncio import AsyncSession
from core.database import get_session
from config import ACCESS_TOKEN_EXPIRE_MINUTES

router = APIRouter(tags=["Login"])

@router.post("/login")
async def login_for_access_token(
    form_data: Annotated[OAuth2PasswordRequestForm, Depends()], db: AsyncSession = Depends(get_session)) -> jwt_schema.Token:

    user = await jwt_repo.authenticate_user(db, form_data.username, form_data.password)
    if not user:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Incorrect username or password", headers={"WWW-Authenticate": "Bearer"},)
    
    access_token_expires = timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    access_token = jwt_repo.create_access_token(
        data={"sub": user.name}, expires_delta=access_token_expires)

    return jwt_schema.Token(access_token=access_token, token_type="bearer")