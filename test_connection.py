#!/usr/bin/env python3
"""
Script simples para testar apenas a conexão com PostgreSQL
"""
import os
from sqlalchemy import create_engine, text
from dotenv import load_dotenv

# Carregar variáveis de ambiente
load_dotenv()

# Configurar conexão
DATABASE_URL = os.getenv("DATABASE_URL", "postgresql+psycopg2://postgres:@localhost:15432/postgres")

print("🔧 Testando conexão PostgreSQL...")
print(f"📊 URL: {DATABASE_URL}")

try:
    # Criar engine
    engine = create_engine(
        DATABASE_URL,
        echo=True,
        connect_args={"connect_timeout": 10}
    )

    # Testar conexão
    with engine.connect() as conn:
        result = conn.execute(text("SELECT version()")).fetchone()
        print(f"✅ Conectado! PostgreSQL versão: {result[0]}")

except Exception as e:
    print(f"❌ Erro de conexão: {e}")
    print("\n💡 Verifique:")
    print("1. Se o Cloud SQL Proxy está rodando: cloud_sql_proxy.exe totvs-colab5:us-east4:fretotvs --port=15432")
    print("2. Se a instância Cloud SQL está ativa: gcloud sql instances list")
    print("3. Se as credenciais estão corretas")
