from datetime import datetime, timedelta, timezone
import jwt
from sqlmodel import select
from fastapi import HTTPException, status
from core.database import SessionDep
from models import login_model
from repository import hashing_repo
from config import SECRET_KEY, ALGORITHM

def authenticate_user(db: SessionDep, totvs_id: str, password: str):
    user = db.exec(select(login_model.User).where(login_model.User.totvs_id == totvs_id)).first()
    if not user:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="ID not found")
    if not hashing_repo.Hash.verify_password(password, user.password):
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Password doesn't match")
    return user


def create_access_token(data: dict, expires_delta: timedelta | None = None):
    to_encode = data.copy()
    if expires_delta:
        expire = datetime.now(timezone.utc) + expires_delta
    else:
        expire = datetime.now(timezone.utc) + timedelta(minutes=15)
    to_encode.update({"exp": expire})
    encoded_jwt = jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)
    return encoded_jwt