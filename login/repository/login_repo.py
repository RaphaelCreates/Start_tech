from fastapi import HTTPException
from schemas import login_schema

def login_request(user_data: login_schema.LoginRequest):
    # Lógica de validação das credenciais
    if user_data.username in DB_USERS and DB_USERS[user_data.username] == user_data.password:
        # Futuramente, a lógica de geração de token (JWT) viria aqui
        return {"message": "Login bem-sucedido!"}
    
    # Se a validação falhar, levanta uma exceção com o status 401
    raise HTTPException(status_code=401, detail="Credenciais inválidas")