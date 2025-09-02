#!/usr/bin/env python3
"""
Script para corrigir os horários no banco de dados
"""

import sys
import os
from datetime import datetime, timedelta
from sqlmodel import Session, create_engine, select

# Adicionar o diretório atual ao path para importar os módulos
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from models.schedule_model import Line, Schedule

# Configuração do banco
DATABASE_URL = "sqlite:///./db.db"
engine = create_engine(DATABASE_URL)

def fix_schedules():
    """Corrigir as datas dos horários no banco"""
    print("🔧 Corrigindo horários no banco de dados...")
    
    with Session(engine) as session:
        # Buscar todos os schedules
        all_schedules = session.exec(select(Schedule)).all()
        print(f"Total de schedules encontrados: {len(all_schedules)}")
        
        now = datetime.now()
        current_weekday = now.weekday() + 1  # Segunda = 1, Terça = 2, etc.
        
        fixed_count = 0
        
        for schedule in all_schedules:
            # Calcular quantos dias adicionar/subtrair para chegar no dia correto
            target_weekday = schedule.day_week
            days_diff = target_weekday - current_weekday
            
            # Se o dia já passou esta semana, programar para a próxima semana
            if days_diff < 0:
                days_diff += 7
            
            # Calcular a data correta
            target_date = now + timedelta(days=days_diff)
            
            # Manter apenas a hora e minuto originais, mas atualizar a data
            original_hour = schedule.departure_time.hour
            original_minute = schedule.departure_time.minute
            
            # Criar novo departure_time com a data correta
            new_departure_time = target_date.replace(
                hour=original_hour, 
                minute=original_minute, 
                second=0, 
                microsecond=0
            )
            
            # Arrival time: 5 minutos antes
            new_arrival_time = new_departure_time - timedelta(minutes=5)
            
            # Atualizar o schedule
            schedule.departure_time = new_departure_time
            schedule.arrival_time = new_arrival_time
            
            session.add(schedule)
            fixed_count += 1
        
        # Commit das mudanças
        session.commit()
        print(f"✅ {fixed_count} schedules corrigidos!")
        
        # Verificar o resultado
        print("\n📊 Verificando horários corrigidos...")
        today_schedules = session.exec(select(Schedule).where(Schedule.day_week == current_weekday)).all()
        future_schedules = [s for s in today_schedules if s.departure_time > now]
        
        print(f"Schedules para hoje (dia {current_weekday}): {len(today_schedules)}")
        print(f"Schedules futuros para hoje: {len(future_schedules)}")
        
        if future_schedules:
            print("\nPróximos horários:")
            for schedule in sorted(future_schedules, key=lambda x: x.departure_time)[:5]:
                print(f"  Linha {schedule.line_id}: {schedule.departure_time.strftime('%H:%M')} (em {(schedule.departure_time - now).total_seconds()/60:.0f} min)")

if __name__ == "__main__":
    fix_schedules()
