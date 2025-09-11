#!/usr/bin/env python3
"""
Script para testar a conexão com o banco de dados local
"""
import os
import sys

# Carregar variáveis de ambiente
try:
    from dotenv import load_dotenv
    load_dotenv()
    print("✅ .env carregado")
except ImportError:
    print("⚠️  python-dotenv não instalado, usando variáveis do sistema")

# Importar configurações do banco
from core.database import engine, create_db_and_tables
from sqlmodel import Session

def test_connection():
    """Testa a conexão com o banco"""
    try:
        print("🔧 Testando conexão com PostgreSQL...")
        with Session(engine) as session:
            from sqlalchemy import text
            result = session.exec(text("SELECT version()")).first()
            print(f"✅ Conectado! Versão: {result}")

        # Testar criação de tabelas
        print("📋 Testando criação de tabelas...")
        create_db_and_tables()
        print("✅ Teste concluído com sucesso!")

    except Exception as e:
        print(f"❌ Erro na conexão: {e}")
        print("💡 Verifique se o PostgreSQL está rodando na porta 15432")
        return False

    return True

if __name__ == "__main__":
    print("🧪 Teste de conexão com banco de dados")
    print("=" * 50)

    success = test_connection()

    if success:
        print("\n🎉 Tudo funcionando! Você pode iniciar a API.")
        sys.exit(0)
    else:
        print("\n❌ Problemas encontrados. Verifique a configuração.")
        sys.exit(1)
