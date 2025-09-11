from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from contextlib import asynccontextmanager
from core.database import create_db_and_tables
from routers import line_router, city_router, schedule_router, bus_router, user_router, authentication_router
import uvicorn, os

# Carregar variáveis de ambiente
try:
    from dotenv import load_dotenv
    load_dotenv()
    print("✅ Configurações carregadas do .env")
except ImportError:
    print("⚠️  python-dotenv não encontrado, usando variáveis do sistema")

@asynccontextmanager
async def lifespan(app: FastAPI):
    print("🚀 Iniciando FretoTVS API...")
    create_db_and_tables()
    print("✅ API pronta!")
    yield
    print("👋 API encerrada")
    yield  

app = FastAPI(lifespan=lifespan)

# Configurar CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(line_router.router)
app.include_router(city_router.router)
app.include_router(schedule_router.router)
app.include_router(bus_router.router)
app.include_router(user_router.router)
app.include_router(authentication_router.router)

# Health checks
@app.get("/")
def root():
    return {
        "message": "FretoTVS API",
        "status": "running",
        "environment": "cloud-run" if os.getenv("K_SERVICE") else "local",
        "version": "1.0"
    }

@app.get("/health")
def health_check():
    return {"status": "healthy", "timestamp": "2025-09-10"}

@app.get("/ready")
def readiness_check():
    """Endpoint para verificar se a app está pronta"""
    return {"status": "ready", "database": bool(os.getenv("K_SERVICE"))}


if __name__ == "__main__":
    port = int(os.environ.get("PORT", 8080))
    uvicorn.run("main:app", host="0.0.0.0", port=port)