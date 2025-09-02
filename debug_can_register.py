#!/usr/bin/env python3
"""
Debug detalhado da função can_register_interest
"""

import sys
import os
import requests
from datetime import datetime
from sqlmodel import Session, create_engine, select

# Adicionar o diretório atual ao path
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from models.schedule_model import Schedule

# Configuração do banco
DATABASE_URL = "sqlite:///./db.db"
engine = create_engine(DATABASE_URL)

def debug_can_register_interest():
    """Debug detalhado da função can_register_interest"""
    print("🔍 DEBUG: can_register_interest")
    print("=" * 50)
    
    now = datetime.now()
    current_day = now.weekday() + 1  # Terça = 2
    
    print(f"Horário atual: {now.strftime('%H:%M:%S')}")
    print(f"Dia atual: {current_day} (Terça)")
    
    # Testar via API
    print(f"\n📡 TESTE VIA API:")
    base_url = "http://localhost:8000"
    
    test_cases = [
        ("Segunda", 1, "12:30"),
        ("Terça", 2, "12:30"),
        ("Quarta", 3, "12:30"),
    ]
    
    for day_name, day_num, time_str in test_cases:
        print(f"\n{day_name} - {time_str}:")
        
        # Via API
        response = requests.get(f"{base_url}/schedules/can-register-interest", params={
            "line_id": 1,
            "departure_time": time_str
        })
        
        if response.status_code == 200:
            data = response.json()
            can_register = data.get('can_register', False)
            print(f"   API retornou: {can_register}")
        else:
            print(f"   Erro na API: {response.status_code}")
        
        # Via banco direto
        with Session(engine) as session:
            schedule = session.exec(
                select(Schedule).where(
                    Schedule.line_id == 1
                ).where(
                    Schedule.day_week == current_day  # ← Sempre filtra pelo dia atual
                ).where(
                    Schedule.departure_time_str == time_str
                )
            ).first()
            
            print(f"   Schedule no banco para DIA ATUAL ({current_day}): {'Sim' if schedule else 'Não'}")
            
            if schedule:
                print(f"   - departure_time: {schedule.departure_time}")
                print(f"   - day_week: {schedule.day_week}")
                print(f"   - ainda não passou: {schedule.departure_time >= now}")
            
            # Verificar se existe schedule para o dia solicitado
            schedule_other_day = session.exec(
                select(Schedule).where(
                    Schedule.line_id == 1
                ).where(
                    Schedule.day_week == day_num  # ← Dia específico do teste
                ).where(
                    Schedule.departure_time_str == time_str
                )
            ).first()
            
            print(f"   Schedule no banco para DIA ESPECÍFICO ({day_num}): {'Sim' if schedule_other_day else 'Não'}")

if __name__ == "__main__":
    debug_can_register_interest()
