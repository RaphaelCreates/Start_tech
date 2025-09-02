#!/usr/bin/env python3
"""
Script de migração para adicionar o campo departure_time_str
"""

import sys
import os
import sqlite3
from datetime import datetime
from sqlmodel import Session, create_engine, select

# Adicionar o diretório atual ao path
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from models.schedule_model import Schedule

# Configuração do banco
DATABASE_URL = "sqlite:///./db.db"
engine = create_engine(DATABASE_URL)

def migrate_database():
    """Migrar banco para adicionar departure_time_str"""
    print("🔄 Migrando banco de dados...")
    
    # Conectar diretamente ao SQLite
    conn = sqlite3.connect('db.db')
    cursor = conn.cursor()
    
    try:
        # Verificar se a coluna já existe
        cursor.execute("PRAGMA table_info(schedule)")
        columns = [column[1] for column in cursor.fetchall()]
        
        if 'departure_time_str' not in columns:
            print("Adicionando coluna departure_time_str...")
            cursor.execute("ALTER TABLE schedule ADD COLUMN departure_time_str TEXT")
            
            # Atualizar registros existentes com base no departure_time
            cursor.execute("SELECT id, departure_time FROM schedule")
            schedules = cursor.fetchall()
            
            for schedule_id, departure_time_str in schedules:
                if departure_time_str:
                    # Extrair apenas HH:MM do datetime
                    dt = datetime.fromisoformat(departure_time_str.replace('T', ' '))
                    time_str = dt.strftime('%H:%M')
                    cursor.execute(
                        "UPDATE schedule SET departure_time_str = ? WHERE id = ?",
                        (time_str, schedule_id)
                    )
            
            conn.commit()
            print("✅ Migração concluída!")
        else:
            print("✅ Coluna departure_time_str já existe")
        
    except Exception as e:
        print(f"❌ Erro na migração: {e}")
        conn.rollback()
    finally:
        conn.close()

if __name__ == "__main__":
    migrate_database()
