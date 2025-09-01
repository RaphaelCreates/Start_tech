# login_repo.py
from fastapi import HTTPException, status
from sqlalchemy.orm import Session
from schemas import login_schema
from models.login import Login as User # <-- Importando o modelo de usuário
from passlib.context import CryptContext

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

def login_request(request: login_schema.LoginRequest, db: Session):
    # Lógica para buscar o usuário no banco de dados
    user_from_db = db.query(User).filter(User.username == request.username).first()

    # Se o usuário não for encontrado ou a senha não for válida, levanta um erro
    if not user_from_db or not pwd_context.verify(request.password, user_from_db.password):
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Credenciais inválidas")

    # Retorna uma mensagem de sucesso com os dados do usuário
    return {"message": "Login bem-sucedido!", "user": {"username": user_from_db.username}}