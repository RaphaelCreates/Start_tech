#!/usr/bin/env python3
from models.schedule_model import *
from sqlmodel import Session, create_engine, select
from datetime import datetime

engine = create_engine('sqlite:///./db.db')

def check_times():
    now = datetime.now()
    current_day = now.weekday() + 1  # Terça = 2
    
    with Session(engine) as session:
        # Verificar todos os horários para hoje
        today_schedules = session.exec(select(Schedule).where(Schedule.day_week == current_day)).all()
        
        print(f"Horário atual: {now.strftime('%H:%M')}")
        print(f"Todos os horários para hoje (terça):")
        
        for schedule in today_schedules:
            status = "PASSOU" if schedule.departure_time < now else "FUTURO"
            print(f"  Linha {schedule.line_id}: {schedule.departure_time.strftime('%H:%M')} ({status})")

if __name__ == "__main__":
    check_times()
