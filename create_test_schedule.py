#!/usr/bin/env python3
"""
Script para criar horários realistas para teste do sistema de tempo
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

def create_realistic_schedule():
    """Criar um horário que simule um ônibus chegando agora"""
    print("🚌 Criando horário realista para teste...")
    
    now = datetime.now()
    print(f"   Horário atual: {now.strftime('%H:%M:%S')}")
    
    # Horário de chegada: agora + 1 minuto
    arrival_time = now + timedelta(minutes=1)
    # Horário de partida: agora + 6 minutos (5 min de parada)
    departure_time = now + timedelta(minutes=6)
    
    current_day = now.weekday() + 1  # Segunda = 1, Terça = 2, etc.
    
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
            
            # Criar novo schedule que está chegando agora
            current_schedule = Schedule(
                line_id=first_line.id,
                arrival_time=arrival_time,
                departure_time=departure_time,
                day_week=current_day,
                interest=5  # Pessoas interessadas
            )
            
            # Criar próximo schedule em 30 minutos
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
            
            print(f"   ✅ Horário CHEGANDO: {arrival_time.strftime('%H:%M')} (chega) - {departure_time.strftime('%H:%M')} (sai)")
            print(f"   ✅ Próximo horário: {next_arrival.strftime('%H:%M')} (chega) - {next_departure.strftime('%H:%M')} (sai)")
            print(f"   📍 Status esperado: 'Ônibus no local' em 1 minuto, por 5 minutos")
            
            return {
                "arrival": arrival_time.strftime('%H:%M:%S'),
                "departure": departure_time.strftime('%H:%M:%S'),
                "line_name": first_line.name
            }
    
    return None

def main():
    print("🕐 CRIANDO HORÁRIO REALISTA PARA TESTE")
    print("=" * 50)
    
    result = create_realistic_schedule()
    
    if result:
        print(f"\n🎯 TESTE CONFIGURADO!")
        print("=" * 50)
        print(f"📍 Linha: {result['line_name']}")
        print(f"🕐 Chega às: {result['arrival']}")
        print(f"🚌 Sai às: {result['departure']}")
        print("\n🔍 COMO TESTAR:")
        print("1. Acesse: http://localhost:5500/frontend/linhas/fretado.html")
        print(f"2. Abra a linha '{result['line_name']}'")
        print("3. Aguarde 1 minuto")
        print("4. Observe mudança para 'Ônibus no local'")
        print("5. Após 6 minutos, deve mostrar próximo horário")
    else:
        print("❌ Erro ao configurar teste")

if __name__ == "__main__":
    main()
