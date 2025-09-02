#!/usr/bin/env python3
"""
Teste da nova lógica de can_register_interest
"""

import sys
import os
from datetime import datetime, timedelta
from sqlmodel import Session, create_engine, select

# Adicionar o diretório atual ao path
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from models.schedule_model import Line, Schedule

# Configuração do banco
DATABASE_URL = "sqlite:///./db.db"
engine = create_engine(DATABASE_URL)

def simulate_can_register_interest(line_id: int, departure_time: str, current_time: datetime):
    """Simula a função can_register_interest com um horário específico"""
    try:
        with Session(engine) as session:
            current_day = current_time.weekday() + 1
            
            # Buscar schedules do dia atual para esta linha
            statement = select(Schedule).where(
                Schedule.line_id == line_id,
                Schedule.day_week == current_day
            ).order_by(Schedule.departure_time)
            
            schedules = session.exec(statement).all()
            
            # Encontrar o schedule solicitado
            target_schedule = None
            for schedule in schedules:
                schedule_time = schedule.departure_time.strftime("%H:%M")
                if schedule_time == departure_time:
                    target_schedule = schedule
                    break
            
            if not target_schedule:
                return False, "Horário não encontrado"
            
            # REGRA 1: Se o horário já passou, não pode registrar interesse
            if target_schedule.departure_time <= current_time:
                return False, "Horário já passou"
            
            # REGRA 2: Só pode registrar interesse no próximo horário disponível
            future_schedules = [s for s in schedules if s.departure_time > current_time]
            
            if not future_schedules:
                return False, "Nenhum horário futuro disponível"
            
            # O próximo horário disponível
            next_schedule = min(future_schedules, key=lambda x: x.departure_time)
            
            # REGRA 3: Só pode registrar se for o próximo horário
            if target_schedule.id == next_schedule.id:
                return True, "É o próximo horário"
            
            # REGRA 4: Verificar se é o horário atual (ônibus chegando)
            arrival_time = target_schedule.departure_time - timedelta(minutes=5)
            if arrival_time <= current_time <= target_schedule.departure_time:
                return True, "Ônibus está chegando/no local"
            
            return False, "Não é o próximo nem o atual"
            
    except Exception as e:
        return False, f"Erro: {str(e)}"

def test_new_logic():
    """Testa a nova lógica com vários cenários"""
    print("🧪 TESTE DA NOVA LÓGICA DE REGISTRO DE INTERESSE")
    print("=" * 60)
    
    # Simular vários horários do dia
    test_times = [
        "09:00", "10:00", "10:30", "11:00", "12:00", "12:30", 
        "13:00", "17:00", "17:30", "18:00", "18:30", "19:00"
    ]
    
    for test_time_str in test_times:
        hour, minute = map(int, test_time_str.split(':'))
        test_time = datetime.now().replace(hour=hour, minute=minute, second=0, microsecond=0)
        
        print(f"\n⏰ SIMULANDO {test_time_str}")
        print(f"Data/hora simulada: {test_time.strftime('%d/%m/%Y %H:%M:%S')}")
        
        # Testar para linha Santana
        with Session(engine) as session:
            santana = session.exec(select(Line).where(Line.name == "Santana")).first()
            if santana:
                # Buscar todos os horários de hoje
                today_schedules = session.exec(
                    select(Schedule).where(
                        Schedule.line_id == santana.id,
                        Schedule.day_week == test_time.weekday() + 1
                    ).order_by(Schedule.departure_time)
                ).all()
                
                print(f"Testando linha {santana.name}:")
                
                for schedule in today_schedules:
                    schedule_time_str = schedule.departure_time.strftime("%H:%M")
                    can_register, reason = simulate_can_register_interest(
                        santana.id, schedule_time_str, test_time
                    )
                    
                    time_diff = (schedule.departure_time - test_time).total_seconds() / 60
                    status = "✅ PODE" if can_register else "❌ NÃO PODE"
                    
                    print(f"  {schedule_time_str} ({time_diff:+.0f}min) - {status} - {reason}")

if __name__ == "__main__":
    test_new_logic()
