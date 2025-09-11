import os
from sqlmodel import SQLModel, Session, create_engine
from google.cloud.sql.connector import Connector, IPTypes
from typing import Annotated
from fastapi import Depends

INSTANCE_CONNECTION_NAME = "totvs-colab5:us-east4:fretotvs"
DB_USER = os.getenv("DB_USER", "postgres")
DB_PASS = os.getenv("DB_PASS", "Postgres123!")
DB_NAME = os.getenv("DB_NAME", "postgres")

def get_engine():
    connector = Connector(ip_type=IPTypes.PUBLIC, refresh_strategy="LAZY")

    def getconn():
        conn = connector.connect(
            INSTANCE_CONNECTION_NAME,
            "pg8000",   
            user=DB_USER,
            password=DB_PASS,
            db=DB_NAME
        )
        return conn

    engine = create_engine(
        "postgresql+pg8000://",
        creator=getconn,
        pool_size=5,
        max_overflow=2,
        echo=True  
    )
    return engine

engine = get_engine()

def create_db_and_tables():
    SQLModel.metadata.create_all(engine)

def get_session():
    with Session(engine) as session:
        yield session


SessionDep = Annotated[Session, Depends(get_session)]