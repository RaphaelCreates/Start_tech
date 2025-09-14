from fastapi import HTTPException, status
from sqlmodel import select
from sqlalchemy.ext.asyncio import AsyncSession
from models import user_model
from repository import hashing_repo

async def create_user(db: AsyncSession, name: str, totvs_id: str, password: str):
    result = await db.execute(select(user_model.User).where(user_model.User.totvs_id == totvs_id))
    user = result.scalars().first()
    if user:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="ID already registered")
    hashed_password = hashing_repo.Hash.get_password_hash(password)
    new_user = user_model.User(name=name, totvs_id=totvs_id, password=hashed_password)
    db.add(new_user)
    await db.commit()
    await db.refresh(new_user)
    return new_user

async def get_user_by_id(db: AsyncSession, totvs_id: str):
    result = await db.execute(select(user_model.User).where(user_model.User.totvs_id == totvs_id))
    user = result.scalars().first()
    if not user:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="User not found")
    return user

async def get_all_users(db: AsyncSession):
    result = await db.execute(select(user_model.User))
    users = result.scalars().all()
    return users

async def delete_user(db: AsyncSession, totvs_id: str):
    result = await db.execute(select(user_model.User).where(user_model.User.totvs_id == totvs_id))
    user = result.scalars().first()
    if not user:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="User not found")
    await db.delete(user)
    await db.commit()
    return {"detail": "User deleted successfully"}

async def update_user(id: int, db: AsyncSession, request: user_model.User):
    db_user = await db.get(user_model.User, id)
    if not db_user:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=f"User not found")
    if request.password not in (None, ""):
        hashed_password = hashing_repo.Hash.get_password_hash(request.password)
        request.password = hashed_password
    user_data = request.model_dump(exclude_unset=True)
    db_user.sqlmodel_update(user_data)
    db.add(db_user)
    await db.commit()
    await db.refresh(db_user)
    return db_user
