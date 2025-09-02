#!/usr/bin/env python3
"""
Script para popular o banco de dados com linhas e horários diversos
Demonstra que o sistema funciona para qualquer linha e horário
"""

import sys
import os
from datetime import datetime, timedelta
from sqlmodel import Session, create_engine, select
from models.schedule_model import Line, Schedule

# Adicionar o diretório atual ao path para importar os módulos
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

# Configuração do banco
DATABASE_URL = "sqlite:///./db.db"
engine = create_engine(DATABASE_URL)

def clear_database():
    """Limpa todas as tabelas para começar do zero"""
    print("🗑️  Limpando banco de dados...")
    with Session(engine) as session:
        # Deletar todos os schedules
        schedules = session.exec(select(Schedule)).all()
        for schedule in schedules:
            session.delete(schedule)
        
        # Deletar todas as linhas
        lines = session.exec(select(Line)).all()
        for line in lines:
            session.delete(line)
        
        session.commit()
    print("✅ Banco de dados limpo!")

def create_lines():
    """Criar várias linhas de ônibus"""
    print("🚌 Criando linhas de ônibus...")
    
    lines_data = [
        {"name": "Santana", "active_bus": 0},
        {"name": "Vila Madalena", "active_bus": 0},
        {"name": "Ipiranga", "active_bus": 0},
        {"name": "Butantã", "active_bus": 0},
        {"name": "Mooca", "active_bus": 0},
        {"name": "Tatuapé", "active_bus": 0},
        {"name": "Lapa", "active_bus": 0},
        {"name": "Penha", "active_bus": 0},
    ]
    
    created_lines = []
    
    with Session(engine) as session:
        for line_data in lines_data:
            line = Line(**line_data)
            session.add(line)
            session.commit()
            session.refresh(line)
            created_lines.append(line)
            print(f"   ✅ Linha criada: {line.name} (ID: {line.id})")
    
    print(f"✅ {len(created_lines)} linhas criadas!")
    return created_lines

def create_schedules_for_line(line: Line, base_times: list, session: Session):
    """Criar horários para uma linha específica"""
    schedules_created = 0
    
    # Criar horários para cada dia da semana (1=segunda, 2=terça, ..., 5=sexta)
    for day_week in range(1, 6):  # Segunda a sexta
        for base_time in base_times:
            # Criar datetime para hoje com o horário especificado
            today = datetime.now().replace(hour=base_time[0], minute=base_time[1], second=0, microsecond=0)
            
            # Arrival time: 5 minutos antes da departure
            arrival_time = today - timedelta(minutes=5)
            departure_time = today
            
            schedule = Schedule(
                line_id=line.id,
                arrival_time=arrival_time,
                departure_time=departure_time,
                day_week=day_week,
                interest=0  # Sempre começar com 0
            )
            
            session.add(schedule)
            schedules_created += 1
    
    return schedules_created

def create_schedules():
    """Criar horários diversos para todas as linhas"""
    print("⏰ Criando horários para as linhas...")
    
    # Diferentes padrões de horários para cada linha
    schedule_patterns = {
        "Santana": [(6, 15), (7, 20), (8, 15), (12, 30), (17, 45), (18, 30)],
        "Vila Madalena": [(6, 30), (7, 45), (8, 30), (12, 15), (17, 30), (19, 0)],
        "Ipiranga": [(6, 0), (7, 15), (8, 45), (12, 45), (17, 15), (18, 45)],
        "Butantã": [(6, 45), (7, 30), (8, 0), (12, 0), (17, 0), (19, 15)],
        "Mooca": [(6, 10), (7, 25), (8, 40), (12, 20), (17, 35), (18, 50)],
        "Tatuapé": [(6, 20), (7, 35), (8, 25), (12, 35), (17, 25), (19, 10)],
        "Lapa": [(6, 35), (7, 50), (8, 20), (12, 50), (17, 20), (18, 35)],
        "Penha": [(6, 5), (7, 10), (8, 35), (12, 10), (17, 40), (19, 5)],
    }
    
    total_schedules = 0
    
    with Session(engine) as session:
        # Buscar todas as linhas
        lines = session.exec(select(Line)).all()
        
        for line in lines:
            # Usar padrão específico da linha ou padrão padrão
            times = schedule_patterns.get(line.name, [(7, 0), (12, 0), (18, 0)])
            
            schedules_count = create_schedules_for_line(line, times, session)
            total_schedules += schedules_count
            
            print(f"   ✅ {schedules_count} horários criados para linha {line.name}")
        
        session.commit()
    
    print(f"✅ Total de {total_schedules} horários criados!")

def create_realistic_current_schedules():
    """Criar alguns horários realistas para teste (horário atual e próximo)"""
    print("🕐 Criando horários realistas para teste...")
    
    now = datetime.now()
    current_time = now.replace(second=0, microsecond=0)
    
    # Horário atual (saindo agora)
    current_departure = current_time + timedelta(minutes=5)
    current_arrival = current_departure - timedelta(minutes=5)
    
    # Próximo horário (em 30 minutos)
    next_departure = current_time + timedelta(minutes=30)
    next_arrival = next_departure - timedelta(minutes=5)
    
    # Horário futuro (em 2 horas)
    future_departure = current_time + timedelta(hours=2)
    future_arrival = future_departure - timedelta(minutes=5)
    
    current_day = now.weekday() + 1  # Segunda = 1, Terça = 2, etc.
    
    with Session(engine) as session:
        # Buscar primeira linha para adicionar horários realistas
        first_line = session.exec(select(Line)).first()
        
        if first_line:
            # Horário atual
            current_schedule = Schedule(
                line_id=first_line.id,
                arrival_time=current_arrival,
                departure_time=current_departure,
                day_week=current_day,
                interest=3  # Já tem algumas pessoas interessadas
            )
            
            # Próximo horário
            next_schedule = Schedule(
                line_id=first_line.id,
                arrival_time=next_arrival,
                departure_time=next_departure,
                day_week=current_day,
                interest=1  # Pouco interesse ainda
            )
            
            # Horário futuro
            future_schedule = Schedule(
                line_id=first_line.id,
                arrival_time=future_arrival,
                departure_time=future_departure,
                day_week=current_day,
                interest=0  # Sem interesse (não deve permitir registro)
            )
            
            session.add(current_schedule)
            session.add(next_schedule)
            session.add(future_schedule)
            session.commit()
            
            print(f"   ✅ Horário ATUAL: {current_departure.strftime('%H:%M')} (interesse: 3)")
            print(f"   ✅ Horário PRÓXIMO: {next_departure.strftime('%H:%M')} (interesse: 1)")
            print(f"   ✅ Horário FUTURO: {future_departure.strftime('%H:%M')} (interesse: 0)")

def show_database_summary():
    """Mostrar resumo do que foi criado"""
    print("\n📊 RESUMO DO BANCO DE DADOS:")
    print("=" * 50)
    
    with Session(engine) as session:
        # Contar linhas
        lines = session.exec(select(Line)).all()
        print(f"🚌 Linhas criadas: {len(lines)}")
        
        for line in lines:
            print(f"   • {line.name}")
        
        # Contar schedules
        schedules = session.exec(select(Schedule)).all()
        print(f"\n⏰ Total de horários: {len(schedules)}")
        
        # Agrupar por dia da semana
        days = {1: "Segunda", 2: "Terça", 3: "Quarta", 4: "Quinta", 5: "Sexta"}
        for day_num, day_name in days.items():
            day_schedules = [s for s in schedules if s.day_week == day_num]
            print(f"   • {day_name}: {len(day_schedules)} horários")
        
        # Mostrar horários com interesse
        interested_schedules = [s for s in schedules if s.interest > 0]
        print(f"\n💡 Horários com interesse: {len(interested_schedules)}")
        
        for schedule in interested_schedules:
            line = session.get(Line, schedule.line_id)
            day_name = days.get(schedule.day_week, "?")
            print(f"   • {line.name} - {day_name} {schedule.departure_time.strftime('%H:%M')} ({schedule.interest} pessoas)")

def main():
    """Função principal"""
    print("🚀 POPULANDO BANCO DE DADOS")
    print("=" * 50)
    
    # 1. Limpar banco
    clear_database()
    
    # 2. Criar linhas
    lines = create_lines()
    
    # 3. Criar horários diversos
    create_schedules()
    
    # 4. Criar horários realistas para teste
    create_realistic_current_schedules()
    
    # 5. Mostrar resumo
    show_database_summary()
    
    print("\n🎉 POPULAÇÃO COMPLETA!")
    print("=" * 50)
    print("✅ O sistema agora tem:")
    print("   • Múltiplas linhas com nomes realistas")
    print("   • Horários diversos para cada dia da semana")
    print("   • Horários atuais/próximos para teste")
    print("   • Diferentes níveis de interesse")
    print("\n🔧 TESTABILIDADE:")
    print("   • Reset automático funcionará para TODOS os horários")
    print("   • Interesse só pode ser registrado em horários atual/próximo")
    print("   • Sistema escala automaticamente para novas linhas")
    print("   • Interface mostrará horários disponíveis/indisponíveis")

if __name__ == "__main__":
    main()
