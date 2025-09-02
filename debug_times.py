#!/usr/bin/env python3
from models.schedule_model import *
from sqlmodel import Session, create_engine, select
from datetime import datetime

engine = create_engine('sqlite:///./db.db')

def debug_times():
    now = datetime.now()
    current_day = now.weekday() + 1  # Terça = 2
    
    with Session(engine) as session:
        # Pegar um horário específico para debug
        schedule = session.exec(select(Schedule).where(Schedule.day_week == current_day).where(Schedule.line_id == 1)).first()
        
        if schedule:
            print(f"Horário atual: {now}")
            print(f"Horário atual formatado: {now.strftime('%Y-%m-%d %H:%M:%S')}")
            print()
            print(f"Schedule departure_time: {schedule.departure_time}")
            print(f"Schedule departure_time formatado: {schedule.departure_time.strftime('%Y-%m-%d %H:%M:%S')}")
            print()
            print(f"Comparison (schedule < now): {schedule.departure_time < now}")
            print()
            
            # Vamos verificar as datas separadamente
            print("Componentes da data atual:")
            print(f"  Ano: {now.year}")
            print(f"  Mês: {now.month}")
            print(f"  Dia: {now.day}")
            print(f"  Hora: {now.hour}")
            print(f"  Minuto: {now.minute}")
            print()
            
            print("Componentes da data do schedule:")
            print(f"  Ano: {schedule.departure_time.year}")
            print(f"  Mês: {schedule.departure_time.month}")
            print(f"  Dia: {schedule.departure_time.day}")
            print(f"  Hora: {schedule.departure_time.hour}")
            print(f"  Minuto: {schedule.departure_time.minute}")

if __name__ == "__main__":
    debug_times()
