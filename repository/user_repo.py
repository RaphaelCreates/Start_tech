from fastapi import HTTPException, status
from sqlmodel import select
from core.database import SessionDep
from models import user_model
from repository import hashing_repo

def create_user(db: SessionDep, name: str, totvs_id: str, password: str):
    user = db.exec(select(user_model.User).where(user_model.User.totvs_id == totvs_id)).first()
    if user:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="ID already registered")
    hashed_password = hashing_repo.Hash.get_password_hash(password)
    new_user = user_model.User(name=name, totvs_id=totvs_id, password=hashed_password)
    db.add(new_user)
    db.commit()
    db.refresh(new_user)
    return new_user

def get_user_by_id(db: SessionDep, totvs_id: str):
    user = db.get(user_model.User.totvs_id, totvs_id)
    if not user:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="User not found")
    return user

def get_all_users(db: SessionDep):
    users = db.exec(select(user_model.User)).all()
    return users

def delete_user(db: SessionDep, totvs_id: str):
    user = db.exec(select(user_model.User).where(user_model.User.totvs_id == totvs_id)).first()
    if not user:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="User not found")
    db.delete(user)
    db.commit()
    return {"detail": "User deleted successfully"}

def update_user(id: int, db: SessionDep, request: user_model.User):
    db_user = db.get(user_model.User, id)
    if not db_user:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=f"User not found")
    if request.password not in (None, ""):
        hashed_password = hashing_repo.Hash.get_password_hash(request.password)
        request.password = hashed_password
    user_data = request.model_dump(exclude_unset=True)
    db_user.sqlmodel_update(user_data)
    db.add(db_user)
    db.commit()
    db.refresh(db_user)
    return db_user
