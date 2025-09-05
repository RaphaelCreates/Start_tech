#!/usr/bin/env python3
"""
Script simples para popular o banco de dados com dados de teste.
Cria 2 cidades, 4 linhas e vários horários para teste da API.
"""

import sys
import os
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from sqlmodel import Session, SQLModel, create_engine, select, delete
from models.schedule_model import City, Line, Schedule, DayOfWeek
from datetime import time

DATABASE_URL = "sqlite:///db.db"

def limpar_banco():
    """Limpa todos os dados do banco"""
    engine = create_engine(DATABASE_URL, echo=False)
    with Session(engine) as session:
        # Deletar tudo na ordem correta (relacionamentos)
        session.exec(delete(Schedule))
        session.exec(delete(Line))
        session.exec(delete(City))
        session.commit()
    print("✅ Banco limpo!")

def popular_banco():
    """Popula o banco com dados de teste"""
    engine = create_engine(DATABASE_URL, echo=False)
    SQLModel.metadata.create_all(engine)
    
    with Session(engine) as session:
        # Criar cidades
        sp = City(state="SP", country="Brasil")
        rj = City(state="RJ", country="Brasil")
        session.add(sp)
        session.add(rj)
        session.commit()
        session.refresh(sp)
        session.refresh(rj)
        
        # Criar linhas em SP
        santana = Line(name="Santana", active_bus=3, city_id=sp.id)
        barra_funda = Line(name="Barra Funda", active_bus=2, city_id=sp.id)
        
        # Criar linhas no RJ
        copacabana = Line(name="Copacabana", active_bus=4, city_id=rj.id)
        ipanema = Line(name="Ipanema", active_bus=2, city_id=rj.id)
        
        session.add(santana)
        session.add(barra_funda)
        session.add(copacabana)
        session.add(ipanema)
        session.commit()
        session.refresh(santana)
        session.refresh(barra_funda)
        session.refresh(copacabana)
        session.refresh(ipanema)
        
        # Horários para cada linha
        horarios_data = {
            santana.id: {
                "nome": "Santana",
                "horarios": ["06:00", "07:30", "09:00", "12:00", "14:30", "17:00", "18:30", "20:00"]
            },
            barra_funda.id: {
                "nome": "Barra Funda", 
                "horarios": ["06:15", "08:00", "10:00", "13:00", "15:30", "17:30", "19:00", "21:00"]
            },
            copacabana.id: {
                "nome": "Copacabana",
                "horarios": ["07:00", "09:30", "11:00", "14:00", "16:30", "18:00", "19:30"]
            },
            ipanema.id: {
                "nome": "Ipanema",
                "horarios": ["06:30", "08:30", "10:30", "12:30", "15:00", "17:15", "19:45"]
            }
        }
        
        # Criar schedules para cada linha em diferentes dias da semana
        total_schedules = 0
        for line_id, data in horarios_data.items():
            print(f"Criando horários para {data['nome']}...")
            
            # Segunda a sexta
            for day in [DayOfWeek.MONDAY, DayOfWeek.TUESDAY, DayOfWeek.WEDNESDAY, 
                       DayOfWeek.THURSDAY, DayOfWeek.FRIDAY]:
                
                # Todos os horários para dias úteis
                for horario_str in data['horarios']:
                    # Horário de chegada
                    arrival_time = time.fromisoformat(horario_str)
                    
                    # Horário de partida (20 minutos depois da chegada)
                    arrival_hour = arrival_time.hour
                    arrival_minute = arrival_time.minute
                    departure_minute = arrival_minute + 20
                    departure_hour = arrival_hour
                    
                    # Ajustar se os minutos passarem de 60
                    if departure_minute >= 60:
                        departure_minute -= 60
                        departure_hour += 1
                        # Ajustar se a hora passar de 23
                        if departure_hour >= 24:
                            departure_hour = 0
                    
                    departure_time = time(hour=departure_hour, minute=departure_minute)
                    
                    schedule = Schedule(
                        line_id=line_id,
                        arrival_time=arrival_time,
                        departure_time=departure_time,
                        day_week=day,
                        interest=0
                    )
                    session.add(schedule)
                    total_schedules += 1
        
        session.commit()
        print(f"✅ {total_schedules} horários criados!")
        
        # Estatísticas
        print("\n📊 Resumo dos dados criados:")
        print(f"- Cidades: {len(session.exec(select(City)).all())}")
        print(f"- Linhas: {len(session.exec(select(Line)).all())}")
        print(f"- Horários: {len(session.exec(select(Schedule)).all())}")
        
        print("\n📍 Cidades e Linhas:")
        cities = session.exec(select(City)).all()
        for city in cities:
            lines = session.exec(select(Line).where(Line.city_id == city.id)).all()
            print(f"  {city.state}/{city.country}:")
            for line in lines:
                schedules_count = len(session.exec(select(Schedule).where(Schedule.line_id == line.id)).all())
                print(f"    - {line.name} ({line.active_bus} ônibus ativos, {schedules_count} horários)")

def main():
    print("🚌 POPULANDO BANCO DE DADOS PARA TESTES")
    print("=" * 50)
    
    print("1. Limpando banco...")
    limpar_banco()
    
    print("2. Criando dados de teste...")
    popular_banco()
    
    print("\n" + "=" * 50)
    print("🎉 PRONTO PARA TESTAR!")
    print("\nVocê pode testar:")
    print("- GET /cities - Ver todas as cidades")
    print("- GET /lines - Ver todas as linhas")
    print("- GET /schedules - Ver todos os horários")
    print("- POST /schedules - Criar novos horários")

if __name__ == "__main__":
    main()
