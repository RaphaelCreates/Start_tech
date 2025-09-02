#!/usr/bin/env python3
from models.schedule_model import *
from sqlmodel import Session, create_engine, select
from datetime import datetime

engine = create_engine('sqlite:///./db.db')

def check_schedules():
    now = datetime.now()
    current_day = now.weekday() + 1  # Terça = 2
    
    with Session(engine) as session:
        # Verificar total de schedules
        all_schedules = session.exec(select(Schedule)).all()
        print(f"Total de schedules no banco: {len(all_schedules)}")
        
        # Verificar schedules para hoje (terça)
        today_schedules = session.exec(select(Schedule).where(Schedule.day_week == current_day)).all()
        print(f"Schedules para hoje (terça - dia {current_day}): {len(today_schedules)}")
        
        if today_schedules:
            print("\nPrimeiros 10 horários de hoje:")
            for i, schedule in enumerate(today_schedules[:10]):
                print(f"  {i+1}. Linha {schedule.line_id}: {schedule.departure_time.strftime('%H:%M')} (interesse: {schedule.interest})")
                
            # Verificar schedules futuros
            future_schedules = [s for s in today_schedules if s.departure_time > now]
            print(f"\nSchedules que ainda não passaram hoje: {len(future_schedules)}")
            
            if future_schedules:
                print("Próximos horários:")
                for schedule in future_schedules[:5]:
                    print(f"  Linha {schedule.line_id}: {schedule.departure_time.strftime('%H:%M')} (interesse: {schedule.interest})")
        
        # Verificar se há linhas
        lines = session.exec(select(Line)).all()
        print(f"\nTotal de linhas: {len(lines)}")
        if lines:
            print("Primeiras 5 linhas:")
            for line in lines[:5]:
                print(f"  ID {line.id}: {line.name}")

if __name__ == "__main__":
    check_schedules()
