#!/usr/bin/env python3
"""
Teste simples direto no banco
"""

import sys
import os
from datetime import datetime
from sqlmodel import Session, create_engine, select

# Adicionar o diretório atual ao path
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from models.schedule_model import Line, Schedule

# Configuração do banco
DATABASE_URL = "sqlite:///./db.db"
engine = create_engine(DATABASE_URL)

def direct_test():
    print("🔍 TESTE DIRETO NO BANCO")
    print("=" * 40)
    
    now = datetime.now()
    print(f"Agora: {now.strftime('%H:%M:%S')}")
    print(f"Dia: {now.weekday() + 1}")
    
    with Session(engine) as session:
        # Buscar schedule da linha 1 (Santana) para hoje
        santana_schedules = session.exec(
            select(Schedule).where(
                Schedule.line_id == 1,
                Schedule.day_week == now.weekday() + 1
            ).order_by(Schedule.departure_time)
        ).all()
        
        print(f"\nSchedules Santana hoje: {len(santana_schedules)}")
        
        for schedule in santana_schedules:
            time_str = schedule.departure_time.strftime('%H:%M')
            is_future = schedule.departure_time >= now
            mins_diff = (schedule.departure_time - now).total_seconds() / 60
            
            print(f"  {time_str} - {'FUTURO' if is_future else 'PASSADO'} ({mins_diff:+.0f}min)")
        
        # Testar outras linhas também
        print(f"\n📊 TESTE EM TODAS AS LINHAS:")
        lines = session.exec(select(Line)).all()
        
        for line in lines:
            schedules_today = session.exec(
                select(Schedule).where(
                    Schedule.line_id == line.id,
                    Schedule.day_week == now.weekday() + 1
                )
            ).all()
            
            future_count = sum(1 for s in schedules_today if s.departure_time >= now)
            past_count = len(schedules_today) - future_count
            
            print(f"  Linha {line.id} ({line.name}): {future_count} futuros, {past_count} passados")

if __name__ == "__main__":
    direct_test()
