from fastapi import FastAPI
from contextlib import asynccontextmanager
from core.database import create_db_and_tables
from routers import line_router, city_router, schedule_router

import uvicorn, os

@asynccontextmanager
async def lifespan(app: FastAPI):
    print("Criando banco de dados e tabelas...")
    create_db_and_tables()
    yield  
    print("API sendo encerrada...")

app = FastAPI(lifespan=lifespan)

app.include_router(line_router.router)
app.include_router(city_router.router)
app.include_router(schedule_router.router)

if __name__ == "__main__":
    uvicorn.run(app, host="0.0.0.0", port=int(os.environ.get("PORT", 8000)))
