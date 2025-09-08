#!/usr/bin/env python3
"""
Script para popular o banco de dados com dados de exemplo
Linha Santana e Linha Barra Funda com seus respectivos horários
"""

from sqlmodel import Session
from core.database import engine
from models.schedule_model import City, Line, Schedule, ScheduleCreate
from datetime import time

def create_time_from_str(time_str: str) -> time:
    """Converte string HH:MM para objeto time"""
    hour, minute = map(int, time_str.split(':'))
    return time(hour, minute)

def populate_database():
    with Session(engine) as session:
        # Criar cidade SP
        city_sp = City(state="SP", country="Brasil")
        session.add(city_sp)
        session.commit()
        session.refresh(city_sp)
        print(f"Cidade criada: {city_sp.state} - ID: {city_sp.id}")
        
        # Criar Linha Santana
        linha_santana = Line(
            city_id=city_sp.id,
            name="Santana",
            active_bus=3,
            active=True
        )
        session.add(linha_santana)
        session.commit()
        session.refresh(linha_santana)
        print(f"Linha criada: {linha_santana.name} - ID: {linha_santana.id}")
        
        # Criar Linha Barra Funda
        linha_barra_funda = Line(
            city_id=city_sp.id,
            name="Barra Funda",
            active_bus=2,
            active=True
        )
        session.add(linha_barra_funda)
        session.commit()
        session.refresh(linha_barra_funda)
        print(f"Linha criada: {linha_barra_funda.name} - ID: {linha_barra_funda.id}")
        
        # Horários Linha Santana (Segunda a Sexta)
        horarios_santana = [
            ("07:20", "07:35"),
            ("07:50", "08:10"),
            ("08:20", "08:40"),
            ("08:50", "09:10"),
            ("09:20", "09:35"),
            ("09:50", "10:10"),
            ("17:40", "18:05"),
            ("18:15", "18:35"),
            ("18:50", "19:15"),
            ("19:25", "19:45"),
            ("20:00", "20:15")
        ]
        
        # Criar schedules para Linha Santana (Segunda a Sexta - dias 1 a 5)
        for arrival_str, departure_str in horarios_santana:
            for day in range(1, 6):  # Segunda a Sexta
                schedule = Schedule(
                    line_id=linha_santana.id,
                    arrival_time=create_time_from_str(arrival_str),
                    departure_time=create_time_from_str(departure_str),
                    day_week=day,
                    interest=0
                )
                session.add(schedule)
        
        # Horários Linha Barra Funda (Segunda a Sexta)
        horarios_barra_funda = [
            ("07:10", "07:25"),
            ("08:20", "08:45"),
            ("09:15", "09:30"),
            ("09:45", "10:05"),
            ("17:40", "18:00"),
            ("18:15", "18:40"),
            ("19:10", "19:30"),
            ("19:50", "20:10")
        ]
        
        # Criar schedules para Linha Barra Funda (Segunda a Sexta - dias 1 a 5)
        for arrival_str, departure_str in horarios_barra_funda:
            for day in range(1, 6):  # Segunda a Sexta
                schedule = Schedule(
                    line_id=linha_barra_funda.id,
                    arrival_time=create_time_from_str(arrival_str),
                    departure_time=create_time_from_str(departure_str),
                    day_week=day,
                    interest=0
                )
                session.add(schedule)
        
        # Horários Alternativos (Terça, Quarta e Quinta-feira)
        # Saída da Barra Funda
        horarios_alternativos_barra_funda = [
            ("07:30", "07:45"),
            ("08:40", "08:55"),
            ("17:30", "18:10"),
            ("19:20", "19:35")
        ]
        
        # Criar schedules alternativos para Barra Funda (Terça, Quarta, Quinta - dias 2, 3, 4)
        for arrival_str, departure_str in horarios_alternativos_barra_funda:
            for day in [2, 3, 4]:  # Terça, Quarta, Quinta
                schedule = Schedule(
                    line_id=linha_barra_funda.id,
                    arrival_time=create_time_from_str(arrival_str),
                    departure_time=create_time_from_str(departure_str),
                    day_week=day,
                    interest=0
                )
                session.add(schedule)
        
        # Saída de Santana (horários alternativos)
        horarios_alternativos_santana = [
            ("08:00", "08:20"),
            ("09:10", "09:25"),
            ("18:30", "18:50"),
            ("19:50", "20:10")
        ]
        
        # Criar schedules alternativos para Santana (Terça, Quarta, Quinta - dias 2, 3, 4)
        for arrival_str, departure_str in horarios_alternativos_santana:
            for day in [2, 3, 4]:  # Terça, Quarta, Quinta
                schedule = Schedule(
                    line_id=linha_santana.id,
                    arrival_time=create_time_from_str(arrival_str),
                    departure_time=create_time_from_str(departure_str),
                    day_week=day,
                    interest=0
                )
                session.add(schedule)
        
        # Commit de todos os schedules
        session.commit()
        print("Todos os horários foram criados com sucesso!")
        
        # Verificar quantos schedules foram criados
        from sqlmodel import select
        total_schedules = len(session.exec(select(Schedule)).all())
        print(f"Total de schedules criados: {total_schedules}")

if __name__ == "__main__":
    print("Iniciando população do banco de dados...")
    populate_database()
    print("População do banco de dados concluída!")
