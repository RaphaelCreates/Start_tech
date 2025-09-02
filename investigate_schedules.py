#!/usr/bin/env python3
"""
Investigar como os schedules estão organizados no banco
"""

import sys
import os
from datetime import datetime
from sqlmodel import Session, create_engine, select

# Adicionar o diretório atual ao path
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from models.schedule_model import Schedule

# Configuração do banco
DATABASE_URL = "sqlite:///./db.db"
engine = create_engine(DATABASE_URL)

def investigate_schedules():
    """Investigar a estrutura dos schedules no banco"""
    print("🔍 INVESTIGAÇÃO: Estrutura dos Schedules")
    print("=" * 60)
    
    with Session(engine) as session:
        # Buscar todos os schedules da linha 1 com departure_time_str = "12:30"
        schedules = session.exec(
            select(Schedule).where(
                Schedule.line_id == 1
            ).where(
                Schedule.departure_time_str == "12:30"
            )
        ).all()
        
        print(f"Schedules da linha 1 com horário 12:30:")
        print("─" * 40)
        
        for schedule in schedules:
            day_name = ['', 'Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta', 'Sábado', 'Domingo'][schedule.day_week]
            print(f"ID: {schedule.id}")
            print(f"  departure_time_str: {schedule.departure_time_str}")
            print(f"  departure_time: {schedule.departure_time}")
            print(f"  day_week: {schedule.day_week} ({day_name})")
            print(f"  interest: {schedule.interest}")
            print("─" * 40)
        
        # Verificar se há schedules para outros dias
        print(f"\nTodos os schedules da linha 1:")
        all_schedules = session.exec(
            select(Schedule).where(Schedule.line_id == 1)
        ).all()
        
        # Agrupar por day_week
        by_day = {}
        for schedule in all_schedules:
            day = schedule.day_week
            if day not in by_day:
                by_day[day] = []
            by_day[day].append(schedule.departure_time_str)
        
        days = ['', 'Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta', 'Sábado', 'Domingo']
        for day_num in sorted(by_day.keys()):
            print(f"\n{days[day_num]} (dia {day_num}):")
            times = sorted(set(by_day[day_num]))
            print(f"  Horários: {', '.join(times)}")

if __name__ == "__main__":
    investigate_schedules()
