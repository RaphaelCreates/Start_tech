from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from core.database import create_db_and_tables
from contextlib import asynccontextmanager
from routers import login_router, authentication_router

@asynccontextmanager
async def lifespan(app: FastAPI):
    print("Criando banco de dados e tabelas...")
    create_db_and_tables()
    yield  
    print("API sendo encerrada...")



app = FastAPI(lifespan=lifespan)

# Configuração do CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(login_router.router)
app.include_router(authentication_router.router)