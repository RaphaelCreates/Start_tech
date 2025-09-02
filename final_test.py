#!/usr/bin/env python3
"""
Teste final do sistema
"""

import sys
import os
from datetime import datetime
from sqlmodel import Session, create_engine, select

# Adicionar o diretório atual ao path
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from models.schedule_model import Line, Schedule
from repository.schedule_repo import can_register_interest, get_schedule_by_line_and_time

# Configuração do banco
DATABASE_URL = "sqlite:///./db.db"
engine = create_engine(DATABASE_URL)

def test_final_system():
    """Teste final do sistema corrigido"""
    print("🧪 TESTE FINAL DO SISTEMA")
    print("=" * 60)
    
    now = datetime.now()
    print(f"Data/hora atual: {now.strftime('%d/%m/%Y %H:%M:%S')}")
    print(f"Dia da semana: {now.weekday() + 1} (segunda=1, terça=2, etc)")
    
    with Session(engine) as session:
        # Buscar todas as linhas
        lines = session.exec(select(Line)).all()
        print(f"\n📍 Total de linhas: {len(lines)}")
        
        # Testar cada linha
        for line in lines:
            print(f"\n🚌 Linha: {line.name}")
            
            # Buscar schedules para hoje
            today_schedules = session.exec(
                select(Schedule).where(
                    Schedule.line_id == line.id,
                    Schedule.day_week == now.weekday() + 1
                )
            ).all()
            
            future_schedules = [
                s for s in today_schedules 
                if s.departure_time > now
            ]
            
            print(f"   Total hoje: {len(today_schedules)}")
            print(f"   Futuros: {len(future_schedules)}")
            
            if future_schedules:
                next_schedule = min(future_schedules, key=lambda x: x.departure_time)
                print(f"   Próximo: {next_schedule.departure_time.strftime('%H:%M')}")
                
                # Testar se pode registrar interesse
                can_register = can_register_interest(line.id, next_schedule.id)
                print(f"   Pode registrar interesse: {'✅' if can_register else '❌'}")
            else:
                print("   ❌ Nenhum horário futuro")
        
        # Teste específico para o problema original
        print("\n🔍 TESTE ESPECÍFICO - PROBLEMA ORIGINAL")
        print("Verificando se há schedules disponíveis na terça-feira às 10:18...")
        
        # Simular consulta da API
        available_schedules = session.exec(
            select(Schedule).where(
                Schedule.day_week == 2,  # Terça-feira
                Schedule.departure_time > datetime.now()
            )
        ).all()
        
        print(f"Schedules disponíveis para terça-feira: {len(available_schedules)}")
        
        if available_schedules:
            print("✅ PROBLEMA RESOLVIDO - Há horários disponíveis!")
            print("Próximos horários:")
            for schedule in sorted(available_schedules, key=lambda x: x.departure_time)[:5]:
                line_name = session.get(Line, schedule.line_id).name
                time_diff = (schedule.departure_time - now).total_seconds() / 60
                print(f"   {line_name}: {schedule.departure_time.strftime('%H:%M')} (em {time_diff:.0f} min)")
        else:
            print("❌ PROBLEMA PERSISTE - Sem horários disponíveis")

if __name__ == "__main__":
    test_final_system()
