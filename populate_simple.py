#!/usr/bin/env python3
"""
Script melhorado para popular o banco com horários usando apenas HH:MM
"""

import sys
import os
from datetime import datetime
from sqlmodel import Session, create_engine, select

# Adicionar o diretório atual ao path
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from models.schedule_model import Line, Schedule, City
from utils.schedule_utils import calculate_schedule_datetime

# Configuração do banco
DATABASE_URL = "sqlite:///./db.db"
engine = create_engine(DATABASE_URL)

def create_schedules_simple():
    """Criar horários usando apenas HH:MM e day_week"""
    print("⏰ Criando horários simplificados...")
    
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
    reference_date = datetime.now()
    
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
                    # Calcular arrival e departure times
                    arrival_time, departure_time = calculate_schedule_datetime(
                        day_week, time_str, reference_date
                    )
                    
                    schedule = Schedule(
                        line_id=line.id,
                        arrival_time=arrival_time,
                        departure_time=departure_time,
                        departure_time_str=time_str,  # Novo campo
                        day_week=day_week,
                        interest=0
                    )
                    
                    session.add(schedule)
                    total_schedules += 1
        
        session.commit()
        print(f"✅ Criados {total_schedules} schedules")
        
        # Verificar resultado
        print("\n📊 Verificando resultado...")
        current_day = reference_date.weekday() + 1
        today_schedules = session.exec(
            select(Schedule).where(Schedule.day_week == current_day)
        ).all()
        
        future_schedules = [
            s for s in today_schedules 
            if s.departure_time > reference_date
        ]
        
        print(f"Schedules para hoje (dia {current_day}): {len(today_schedules)}")
        print(f"Schedules futuros para hoje: {len(future_schedules)}")
        
        if future_schedules:
            print("\nPróximos horários:")
            for schedule in sorted(future_schedules, key=lambda x: x.departure_time)[:5]:
                print(f"  Linha {schedule.line_id}: {schedule.departure_time_str} (em {(schedule.departure_time - reference_date).total_seconds()/60:.0f} min)")

def add_simple_schedule(line_name: str, day_week: int, time_str: str):
    """
    Função para adicionar um horário simples
    
    Args:
        line_name: Nome da linha
        day_week: Dia da semana (1=segunda, 2=terça, etc.)
        time_str: Horário no formato "HH:MM"
    """
    with Session(engine) as session:
        # Buscar a linha
        line = session.exec(select(Line).where(Line.name == line_name)).first()
        if not line:
            print(f"❌ Linha '{line_name}' não encontrada")
            return False
        
        # Calcular datas
        arrival_time, departure_time = calculate_schedule_datetime(day_week, time_str)
        
        # Criar schedule
        schedule = Schedule(
            line_id=line.id,
            arrival_time=arrival_time,
            departure_time=departure_time,
            departure_time_str=time_str,
            day_week=day_week,
            interest=0
        )
        
        session.add(schedule)
        session.commit()
        
        days = ['', 'Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta', 'Sábado', 'Domingo']
        print(f"✅ Adicionado: {line_name} - {days[day_week]} - {time_str}")
        return True

if __name__ == "__main__":
    print("🚌 NOVO SISTEMA DE HORÁRIOS SIMPLIFICADO")
    print("=" * 50)
    create_schedules_simple()
    
    print("\n💡 EXEMPLOS DE USO:")
    print("Para adicionar um horário:")
    print("add_simple_schedule('Santana', 2, '14:30')  # Terça-feira às 14:30")
    print("add_simple_schedule('Vila Madalena', 5, '20:00')  # Sexta-feira às 20:00")
