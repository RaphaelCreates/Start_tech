from fastapi import FastAPI, HTTPException
from pydantic import BaseModel

# Crie a instância da aplicação
app = FastAPI()

# Define um modelo de dados para a requisição de login.
# garantia que tenha'username' e 'password'.
class LoginRequest(BaseModel):
    username: str
    password: str

# Simulação temporária de um banco de dados de usuários
DB_USERS = {
    "funcionario01": "senha123",
    "admin": "adminpassword"
}

# endpoint de login (POST /login)
@app.post("/login")
def login(user_data: LoginRequest):
    # Lógica de validação das credenciais
    if user_data.username in DB_USERS and DB_USERS[user_data.username] == user_data.password:
        # Futuramente, a lógica de geração de token (JWT) viria aqui
        return {"message": "Login bem-sucedido!"}
    
    # Se a validação falhar, levanta uma exceção com o status 401
    raise HTTPException(status_code=401, detail="Credenciais inválidas")