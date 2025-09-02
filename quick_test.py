#!/usr/bin/env python3
"""
Script simples para criar horário de teste
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

def main():
    now = datetime.now()
    print(f"Horario atual: {now.strftime('%H:%M:%S')}")
    
    # Horário de chegada: agora + 1 minuto
    arrival_time = now + timedelta(minutes=1)
    # Horário de partida: agora + 6 minutos
    departure_time = now + timedelta(minutes=6)
    
    current_day = now.weekday() + 1
    
    with Session(engine) as session:
        # Buscar primeira linha
        first_line = session.exec(select(Line)).first()
        
        if first_line:
            # Remover schedules antigos da primeira linha para hoje
            old_schedules = session.exec(
                select(Schedule).where(
                    Schedule.line_id == first_line.id
                ).where(
                    Schedule.day_week == current_day
                )
            ).all()
            
            for schedule in old_schedules:
                session.delete(schedule)
            
            # Criar schedule que está chegando agora
            current_schedule = Schedule(
                line_id=first_line.id,
                arrival_time=arrival_time,
                departure_time=departure_time,
                day_week=current_day,
                interest=5
            )
            
            # Próximo schedule em 30 minutos
            next_arrival = now + timedelta(minutes=25)
            next_departure = now + timedelta(minutes=30)
            
            next_schedule = Schedule(
                line_id=first_line.id,
                arrival_time=next_arrival,
                departure_time=next_departure,
                day_week=current_day,
                interest=2
            )
            
            session.add(current_schedule)
            session.add(next_schedule)
            session.commit()
            
            print(f"TESTE CONFIGURADO para linha: {first_line.name}")
            print(f"Chega as: {arrival_time.strftime('%H:%M:%S')}")
            print(f"Sai as: {departure_time.strftime('%H:%M:%S')}")
            print("Em 1 minuto deve mostrar: 'Onibus no local'")
            print("Teste em: http://localhost:5500/frontend/linhas/fretado.html")

if __name__ == "__main__":
    main()
