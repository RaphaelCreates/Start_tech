from typing import Annotated
import jwt
from jwt.exceptions import InvalidTokenError, ExpiredSignatureError
from fastapi.security import OAuth2PasswordBearer
from fastapi import Depends, HTTPException, status
from core import oauth2
from core.database import SessionDep
from models import user_model
from sqlmodel import select
from schemas import jwt_schema
from config import ALGORITHM, SECRET_KEY

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/login")

async def get_current_user(token: Annotated[str, Depends(oauth2_scheme)], db: SessionDep):
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        name = payload.get("sub")
        if name is None:
            raise credentials_exception
        token_data = jwt_schema.TokenData(name=name)
    except ExpiredSignatureError:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Token has expired",
            headers={"WWW-Authenticate": "Bearer"},
        )
    except InvalidTokenError:
        raise credentials_exception
    user = db.exec(select(user_model.User).where(user_model.User.name == token_data.name)).first()
    if user is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found"
        )
    return user