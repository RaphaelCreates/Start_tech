from utils.database import SessionDep
from fastapi import HTTPException, status
from sqlalchemy.orm import Session
from schemas import login_schema
from models.login import Login as User # <-- Importando o modelo de usuário
from passlib.context import CryptContext
from .token_service import create_access_token, validate_access_token

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

def login_request(request: login_schema.LoginRequest, db: Session):
    # Lógica para buscar o usuário no banco de dados
    user_from_db = db.query(User).filter(User.username == request.username).first()

    # Se o usuário não for encontrado ou a senha não for válida, levanta um erro
    if not user_from_db or not pwd_context.verify(request.password, user_from_db.password):
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Credenciais inválidas")

    
    return {"message": "Login bem-sucedido!", "user": {"username": user_from_db.username}}

def create_user(request: login_schema.LoginRequest, db: SessionDep):
    # Verifica se o nome de usuário já existe
    existing_user = db.query(User).filter(User.username == request.username).first()
    if existing_user:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Nome de usuário já existe")

    # Cria um novo usuário com a senha criptografada
    hashed_password = pwd_context.hash(request.password)
    new_user = User(username=request.username, password=hashed_password)
    db.add(new_user)
    db.commit()
    db.refresh(new_user)
    
    # Gera um token de acesso para o novo usuário
    acess_token = create_access_token(data={"sub": new_user.username})

    
    return {"message": "Usuário criado com sucesso!", "user": {"username": new_user.username}}