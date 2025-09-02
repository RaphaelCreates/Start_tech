#!/usr/bin/env python3
"""
Script para testar o problema de registro de interesse em horários passados
"""

import sys
import os
from datetime import datetime
from sqlmodel import Session, create_engine, select

# Adicionar o diretório atual ao path
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from models.schedule_model import Line, Schedule
from repository.schedule_repo import can_register_interest, register_interest

# Configuração do banco
DATABASE_URL = "sqlite:///./db.db"
engine = create_engine(DATABASE_URL)

def test_interest_registration():
    """Teste específico para verificar registro de interesse"""
    print("🔍 TESTE DE REGISTRO DE INTERESSE")
    print("=" * 60)
    
    now = datetime.now()
    print(f"Hora atual: {now.strftime('%d/%m/%Y %H:%M:%S')}")
    print(f"Dia da semana: {now.weekday() + 1} (segunda=1, terça=2, etc)")
    
    with Session(engine) as session:
        # Buscar todas as linhas
        lines = session.exec(select(Line)).all()
        
        for line in lines:
            print(f"\n🚌 LINHA: {line.name} (ID: {line.id})")
            
            # Buscar todos os schedules desta linha para hoje
            today_schedules = session.exec(
                select(Schedule).where(
                    Schedule.line_id == line.id,
                    Schedule.day_week == now.weekday() + 1
                )
            ).all()
            
            print(f"   Total schedules hoje: {len(today_schedules)}")
            
            for schedule in today_schedules:
                time_str = schedule.departure_time.strftime('%H:%M')
                is_future = schedule.departure_time >= now
                time_diff = (schedule.departure_time - now).total_seconds() / 60
                
                # Testar can_register_interest
                can_register = can_register_interest(session, line.id, time_str)
                
                status = "✅ FUTURO" if is_future else "❌ PASSADO"
                can_status = "✅ PODE" if can_register else "❌ NÃO PODE"
                
                print(f"   {time_str} - {status} ({time_diff:+.0f}min) - {can_status} registrar interesse")
                
                # Se pode registrar mas já passou, há problema!
                if can_register and not is_future:
                    print(f"   ⚠️  PROBLEMA DETECTADO: Pode registrar interesse em horário que já passou!")
                
                # Se não pode registrar mas é futuro, pode ser outro problema
                if not can_register and is_future:
                    print(f"   ⚠️  POSSÍVEL PROBLEMA: Não pode registrar interesse em horário futuro!")
            
            # Testar especificamente alguns casos problemáticos
            print(f"\n   🧪 TESTES ESPECÍFICOS:")
            
            # Teste 1: Horário que certamente já passou (06:00)
            test_result_1 = can_register_interest(session, line.id, "06:00")
            print(f"   Teste 06:00: {'✅ PODE' if test_result_1 else '❌ NÃO PODE'} - {'ERRO!' if test_result_1 else 'OK'}")
            
            # Teste 2: Horário futuro (se existir)
            future_schedules = [s for s in today_schedules if s.departure_time > now]
            if future_schedules:
                next_schedule = min(future_schedules, key=lambda x: x.departure_time)
                next_time_str = next_schedule.departure_time.strftime('%H:%M')
                test_result_2 = can_register_interest(session, line.id, next_time_str)
                print(f"   Teste {next_time_str}: {'✅ PODE' if test_result_2 else '❌ NÃO PODE'} - {'OK' if test_result_2 else 'ERRO!'}")

if __name__ == "__main__":
    test_interest_registration()
