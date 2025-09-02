#!/usr/bin/env python3
"""
Debug específico dos horários 12:00 e 18:00
"""

import sys
import os
from datetime import datetime
from sqlmodel import Session, create_engine, select

# Adicionar o diretório atual ao path
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from models.schedule_model import Schedule, Line

# Configuração do banco
DATABASE_URL = "sqlite:///./db.db"
engine = create_engine(DATABASE_URL)

def debug_specific_times():
    """Debug dos horários 12:00 e 18:00"""
    print("🔍 DEBUG: Horários 12:00 e 18:00")
    print("=" * 50)
    
    now = datetime.now()
    current_day = now.weekday() + 1  # Terça = 2
    
    print(f"Horário atual: {now.strftime('%H:%M:%S')}")
    print(f"Dia atual: {current_day} (Terça)")
    
    with Session(engine) as session:
        # Verificar se existem schedules para 12:00 e 18:00 hoje
        test_times = ["12:00", "18:00"]
        
        for time_str in test_times:
            print(f"\n🔍 Verificando {time_str}:")
            
            # Buscar schedule específico
            schedule = session.exec(
                select(Schedule).where(
                    Schedule.line_id == 1
                ).where(
                    Schedule.day_week == current_day
                ).where(
                    Schedule.departure_time_str == time_str
                )
            ).first()
            
            if schedule:
                print(f"   ✅ Schedule encontrado:")
                print(f"   - ID: {schedule.id}")
                print(f"   - departure_time_str: {schedule.departure_time_str}")
                print(f"   - departure_time: {schedule.departure_time}")
                print(f"   - day_week: {schedule.day_week}")
                print(f"   - Comparação (schedule.departure_time >= now): {schedule.departure_time >= now}")
                
                # Verificar componentes da data
                print(f"   - Schedule datetime: {schedule.departure_time.strftime('%Y-%m-%d %H:%M:%S')}")
                print(f"   - Now datetime: {now.strftime('%Y-%m-%d %H:%M:%S')}")
                
                # Diferença em minutos
                diff = (schedule.departure_time - now).total_seconds() / 60
                print(f"   - Diferença: {diff:.1f} minutos")
                
            else:
                print(f"   ❌ Schedule NÃO encontrado para {time_str}")
                
                # Verificar se existe com departure_time_str None
                all_schedules = session.exec(
                    select(Schedule).where(
                        Schedule.line_id == 1
                    ).where(
                        Schedule.day_week == current_day
                    )
                ).all()
                
                print(f"   📋 Schedules da linha 1 para hoje:")
                for s in all_schedules:
                    print(f"     - {s.departure_time_str} ({s.departure_time.strftime('%H:%M')})")

if __name__ == "__main__":
    debug_specific_times()
