from sqlmodel import Session, SQLModel, create_engine
from fastapi import Depends
from typing import Annotated
import os

# Variáveis de ambiente
CLOUD_SQL_CONNECTION_NAME = os.environ.get("CLOUD_SQL_CONNECTION_NAME")
DB_USER = os.environ.get("DB_USER")
DB_PASS = os.environ.get("DB_PASS")
DB_NAME = os.environ.get("DB_NAME")

if not CLOUD_SQL_CONNECTION_NAME:
    raise RuntimeError("⚠️ A variável CLOUD_SQL_CONNECTION_NAME não está definida")

# Conexão via Unix socket
unix_socket_path = f"/cloudsql/{CLOUD_SQL_CONNECTION_NAME}/.s.PGSQL.5432"
DATABASE_URL = f"postgresql+pg8000://{DB_USER}:{DB_PASS}@/{DB_NAME}?unix_sock={unix_socket_path}"

# Cria engine
engine = create_engine(
    DATABASE_URL,
    pool_size=5,
    max_overflow=2,
    pool_timeout=30,
    pool_recycle=1800,
)

def create_db_and_tables():
    SQLModel.metadata.create_all(engine)

def get_session():
    with Session(engine) as session:
        yield session


SessionDep = Annotated[Session, Depends(get_session)]