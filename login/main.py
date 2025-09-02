from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from routers.login_router import router as login_router
from utils.database import create_db_and_tables

# Crie a instância da sua aplicação
app = FastAPI()

# O array de 'origins' diz quais endereços podem se conectar à sua API
origins = ["*"]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Inclua o roteador do seu arquivo 'routers/login_router.py'
app.include_router(login_router, prefix="/api/v1/auth")