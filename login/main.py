
from fastapi import FastAPI
from routers import login_router
from utils.database import create_db_and_tables


app = FastAPI()

# Inicializa o banco de dados e as tabelas

create_db_and_tables()

# Inclua o roteador do seu arquivo 'routers/login_router.py'
app.include_router(login_router.router, prefix="/api/v1")