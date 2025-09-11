from sqlmodel import Session, SQLModel, create_engine
from typing import Annotated
from fastapi import Depends
import os

# Informações do banco
DB_USER = os.getenv("DB_USER", "postgres")
DB_NAME = os.getenv("DB_NAME", "postgres")
DB_PASS = os.getenv("DB_PASS", "")

# Nome da instância Cloud SQL
INSTANCE_CONNECTION_NAME = os.getenv(
    "INSTANCE_CONNECTION_NAME", "totvs-colab5:us-east4:fretotvs"
)

# Configuração condicional do banco
if os.getenv("K_SERVICE"):
    print("☁️  Cloud Run detectado - Usando Cloud SQL Auth Proxy")
    # Quando usar o proxy, conectar via localhost:5432
    DATABASE_URL = f"postgresql+psycopg2://{DB_USER}:{DB_PASS}@localhost:5432/{DB_NAME}"

    # Engine otimizado para Cloud Run
    engine = create_engine(
        DATABASE_URL,
        echo=False,
        pool_pre_ping=True,
        pool_recycle=300,
        pool_timeout=30,
        max_overflow=10,
        pool_size=5,
        connect_args={
            "connect_timeout": 30,
            "application_name": "fretotvs_backend"
        }
    )
else:
    print("💻 Ambiente local detectado")

    # Verificar se há PostgreSQL configurado, senão usar SQLite
    db_url = os.getenv("DATABASE_URL")
    if db_url and "postgresql" in db_url:
        print("📊 Usando PostgreSQL local")
        DATABASE_URL = db_url
        engine = create_engine(
            DATABASE_URL,
            echo=True,
            pool_pre_ping=True,
            connect_args={
                "connect_timeout": 10,
                "application_name": "fretotvs_dev"
            }
        )
    else:
        print("📊 Usando SQLite para desenvolvimento (PostgreSQL não configurado)")
        DATABASE_URL = "sqlite:///./dev_database.db"
        engine = create_engine(
            DATABASE_URL,
            echo=True,
            connect_args={"check_same_thread": False}
        )

print(f"📊 URL do banco: {DATABASE_URL.replace(DB_PASS, '***') if DB_PASS else DATABASE_URL}")

def create_db_and_tables():
    """Cria tabelas do banco de dados"""
    try:
        print("🔧 Testando conexão com banco de dados...")

        # Teste de conexão primeiro
        with Session(engine) as session:
            from sqlalchemy import text
            result = session.exec(text("SELECT 1")).first()
            print("✅ Conexão com banco estabelecida!")

        # Criar tabelas
        print("📋 Criando tabelas...")
        SQLModel.metadata.create_all(engine)
        print("✅ Tabelas criadas com sucesso!")

    except Exception as e:
        print(f"❌ Erro ao configurar banco: {e}")
        if os.getenv("K_SERVICE"):
            # No Cloud Run, não falhar o startup por causa do banco
            print("⚠️  Continuando inicialização sem banco...")
        else:
            # Em desenvolvimento, mostrar o erro completo
            raise


def get_session():
    with Session(engine) as session:
        yield session


SessionDep = Annotated[Session, Depends(get_session)]
