import os
from sqlmodel import SQLModel
from typing import AsyncGenerator
from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession, async_sessionmaker
from google.cloud.sql.connector import Connector, IPTypes
from dotenv import load_dotenv

load_dotenv()

INSTANCE_CONNECTION_NAME = os.getenv("INSTANCE_CONNECTION_NAME")
DB_USER = os.getenv("DB_USER")
DB_PASS = os.getenv("DB_PASS")
DB_NAME = os.getenv("DB_NAME")

connector: Connector | None = None
engine = None
async_session = None

async def get_engine():
    global engine
    if engine is None:
        await init_engine()
    return engine

async def init_engine():
    global connector, engine, async_session
    if connector is None:
        connector = Connector()

    async def getconn():
        conn = await connector.connect_async(
            INSTANCE_CONNECTION_NAME,
            "asyncpg",
            user=DB_USER,
            password=DB_PASS,
            db=DB_NAME,
            ip_type=IPTypes.PUBLIC
        )
        return conn

    engine = create_async_engine(
        "postgresql+asyncpg://",
        async_creator=getconn,
        echo=False
    )

    async_session = async_sessionmaker(
        engine,
        class_=AsyncSession,
        expire_on_commit=False
    )

async def create_db_and_tables():
    if engine is None:
        raise RuntimeError("Engine não inicializado. Chame init_engine() primeiro.")
    async with engine.begin() as conn:
        await conn.run_sync(SQLModel.metadata.create_all)

async def get_session() -> AsyncGenerator[AsyncSession, None]:
    if engine is None:
        raise RuntimeError("Engine não inicializado. Chame init_engine() primeiro.")
    async with async_session() as session:
        yield session

async def close_connector():
    global connector
    if connector:
        await connector.close_async()
        connector = None
