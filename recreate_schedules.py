#!/usr/bin/env python3
"""
Script para recriar horários corretamente usando apenas datetime
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

def recreate_schedules_correctly():
    """Recriar horários com datas calculadas corretamente"""
    print("🔧 RECRIANDO HORÁRIOS COM DATETIME CORRETO")
    print("=" * 60)
    
    # Padrões de horários por linha (apenas HH:MM)
    schedule_patterns = {
        "Santana": ["06:15", "07:20", "08:15", "12:30", "17:45", "18:30"],
        "Vila Madalena": ["06:30", "07:45", "08:30", "12:15", "17:30", "19:00"],
        "Ipiranga": ["06:00", "07:15", "08:45", "12:45", "17:15", "18:45"],
        "Butantã": ["06:45", "07:30", "08:00", "12:00", "17:00", "19:15"],
        "Mooca": ["06:10", "07:25", "08:40", "12:20", "17:35", "18:50"],
        "Tatuapé": ["06:20", "07:35", "08:25", "12:35", "17:25", "19:10"],
        "Lapa": ["06:35", "07:50", "08:20", "12:50", "17:20", "18:35"],
        "Penha": ["06:05", "07:10", "08:35", "12:10", "17:40", "19:05"],
    }
    
    total_schedules = 0
    now = datetime.now()
    
    with Session(engine) as session:
        # Limpar schedules existentes
        existing_schedules = session.exec(select(Schedule)).all()
        for schedule in existing_schedules:
            session.delete(schedule)
        session.commit()
        print(f"🗑️ Removidos {len(existing_schedules)} schedules antigos")
        
        # Buscar todas as linhas
        lines = session.exec(select(Line)).all()
        
        for line in lines:
            line_pattern = schedule_patterns.get(line.name, schedule_patterns["Santana"])
            
            # Criar horários para cada dia da semana (1=segunda a 5=sexta)
            for day_week in range(1, 6):
                for time_str in line_pattern:
                    # Parse do horário
                    hour, minute = map(int, time_str.split(':'))
                    
                    # Calcular a data correta para o dia da semana
                    current_weekday = now.weekday() + 1  # Monday = 1
                    days_diff = day_week - current_weekday
                    
                    # Se o dia já passou esta semana, programar para a próxima semana
                    if days_diff < 0:
                        days_diff += 7
                    elif days_diff == 0:
                        # Se é hoje, verificar se o horário já passou
                        schedule_time = now.replace(hour=hour, minute=minute, second=0, microsecond=0)
                        if schedule_time <= now:
                            # Se já passou, programar para a próxima semana
                            days_diff = 7
                    
                    # Calcular a data do schedule
                    target_date = now + timedelta(days=days_diff)
                    
                    # Criar departure_time
                    departure_time = target_date.replace(
                        hour=hour, 
                        minute=minute, 
                        second=0, 
                        microsecond=0
                    )
                    
                    # Arrival time: 5 minutos antes
                    arrival_time = departure_time - timedelta(minutes=5)
                    
                    schedule = Schedule(
                        line_id=line.id,
                        arrival_time=arrival_time,
                        departure_time=departure_time,
                        day_week=day_week,
                        interest=0
                    )
                    
                    session.add(schedule)
                    total_schedules += 1
        
        session.commit()
        print(f"✅ Criados {total_schedules} schedules")
        
        # Verificar resultado
        print("\n📊 Verificando resultado...")
        current_day = now.weekday() + 1
        today_schedules = session.exec(
            select(Schedule).where(Schedule.day_week == current_day)
        ).all()
        
        future_schedules = [
            s for s in today_schedules 
            if s.departure_time > now
        ]
        
        print(f"Schedules para hoje (dia {current_day}): {len(today_schedules)}")
        print(f"Schedules futuros para hoje: {len(future_schedules)}")
        
        if future_schedules:
            print("\nPróximos horários:")
            for schedule in sorted(future_schedules, key=lambda x: x.departure_time)[:5]:
                print(f"  Linha {schedule.line_id}: {schedule.departure_time.strftime('%H:%M')} (em {(schedule.departure_time - now).total_seconds()/60:.0f} min)")

if __name__ == "__main__":
    recreate_schedules_correctly()
