#!/usr/bin/env python3
"""
Script para repopular o banco de dados com vários horários para todas as linhas.
"""

import sys
import os
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from datetime import datetime, timedelta
from core.database import get_session
from models.schedule_model import Schedule
from sqlmodel import select, delete
import random

def clear_all_schedules():
    """Remove todos os schedules existentes"""
    session = next(get_session())
    try:
        # Deletar todos os schedules
        statement = delete(Schedule)
        session.exec(statement)
        session.commit()
        print("✅ Todos os schedules foram removidos")
    except Exception as e:
        session.rollback()
        print(f"❌ Erro ao limpar schedules: {e}")
    finally:
        session.close()

def get_base_date_for_day(day_week):
    """Retorna uma data base para um dia da semana específico"""
    # Usar a semana atual como referência
    today = datetime.now().date()
    current_weekday = today.weekday() + 1  # 1=segunda, 2=terça, etc.
    
    # Calcular quantos dias somar/subtrair para chegar no dia desejado
    days_diff = day_week - current_weekday
    target_date = today + timedelta(days=days_diff)
    
    return target_date

def create_diverse_schedules():
    """Cria horários diversificados para todas as linhas"""
    session = next(get_session())
    
    try:
        # Definir horários base para cada tipo de período
        horarios_manha = ["06:00", "06:30", "07:00", "07:30", "08:00", "08:30"]
        horarios_almoco = ["11:30", "12:00", "12:30", "13:00", "13:30"]
        horarios_tarde = ["14:00", "15:00", "16:00", "17:00", "17:30", "18:00"]
        horarios_noite = ["18:30", "19:00", "19:30", "20:00"]
        
        # Criar schedules para cada linha (1 a 8) e cada dia útil (1 a 5)
        schedules_criados = 0
        
        for line_id in range(1, 9):  # Linhas 1 a 8
            print(f"\nCriando horários para Linha {line_id}:")
            
            for day_week in range(1, 6):  # Segunda a sexta (1 a 5)
                dia_nomes = ["", "Segunda", "Terça", "Quarta", "Quinta", "Sexta"]
                print(f"  {dia_nomes[day_week]}:", end=" ")
                
                # Obter data base para este dia
                base_date = get_base_date_for_day(day_week)
                
                # Selecionar horários aleatórios para esta linha/dia
                horarios_dia = []
                
                # Sempre ter pelo menos 2-3 horários de manhã
                horarios_dia.extend(random.sample(horarios_manha, random.randint(2, 4)))
                
                # Chance de ter horários de almoço
                if random.random() > 0.3:  # 70% de chance
                    horarios_dia.extend(random.sample(horarios_almoco, random.randint(1, 2)))
                
                # Sempre ter horários de tarde
                horarios_dia.extend(random.sample(horarios_tarde, random.randint(2, 4)))
                
                # Chance de ter horários de noite
                if random.random() > 0.5:  # 50% de chance
                    horarios_dia.extend(random.sample(horarios_noite, random.randint(1, 2)))
                
                # Ordenar horários
                horarios_dia.sort()
                
                # Criar schedules
                for horario_str in horarios_dia:
                    try:
                        # Converter string para datetime
                        hora, minuto = map(int, horario_str.split(':'))
                        
                        # Horário de chegada (5 minutos antes)
                        arrival_datetime = datetime.combine(base_date, datetime.min.time().replace(hour=hora, minute=minuto))
                        arrival_datetime -= timedelta(minutes=5)
                        
                        # Horário de partida
                        departure_datetime = datetime.combine(base_date, datetime.min.time().replace(hour=hora, minute=minuto))
                        
                        # Criar schedule
                        schedule = Schedule(
                            line_id=line_id,
                            day_week=day_week,
                            arrival_time=arrival_datetime,
                            departure_time=departure_datetime,
                            interested_count=0
                        )
                        
                        session.add(schedule)
                        schedules_criados += 1
                        
                    except Exception as e:
                        print(f"\n❌ Erro ao criar schedule {horario_str}: {e}")
                
                print(f"{len(horarios_dia)} horários")
        
        # Confirmar mudanças
        session.commit()
        print(f"\n✅ {schedules_criados} schedules criados com sucesso!")
        
        # Mostrar estatísticas
        print("\n📊 Estatísticas:")
        statement = select(Schedule)
        all_schedules = session.exec(statement).all()
        
        # Contar por linha
        print("Por linha:")
        for line_id in range(1, 9):
            count = len([s for s in all_schedules if s.line_id == line_id])
            print(f"  Linha {line_id}: {count} horários")
        
        # Contar por dia
        print("Por dia da semana:")
        dia_nomes = ["", "Segunda", "Terça", "Quarta", "Quinta", "Sexta"]
        for day_week in range(1, 6):
            count = len([s for s in all_schedules if s.day_week == day_week])
            print(f"  {dia_nomes[day_week]}: {count} horários")
            
    except Exception as e:
        session.rollback()
        print(f"❌ Erro ao criar schedules: {e}")
        import traceback
        traceback.print_exc()
    finally:
        session.close()

def create_special_test_cases():
    """Cria casos especiais para teste"""
    session = next(get_session())
    
    try:
        print("\n🎯 Criando casos especiais para teste...")
        
        # Caso 1: Linha 9 com horários só na segunda-feira
        print("  Linha 9: Apenas segunda-feira")
        base_date = get_base_date_for_day(1)  # Segunda
        
        horarios_segunda = ["08:00", "12:00", "17:30"]
        for horario_str in horarios_segunda:
            hora, minuto = map(int, horario_str.split(':'))
            
            arrival_datetime = datetime.combine(base_date, datetime.min.time().replace(hour=hora, minute=minuto))
            arrival_datetime -= timedelta(minutes=5)
            
            departure_datetime = datetime.combine(base_date, datetime.min.time().replace(hour=hora, minute=minuto))
            
            schedule = Schedule(
                line_id=9,  # Linha especial
                day_week=1,  # Apenas segunda
                arrival_time=arrival_datetime,
                departure_time=departure_datetime,
                interested_count=0
            )
            
            session.add(schedule)
        
        # Caso 2: Linha 10 com horários atuais (para teste de "ônibus no local")
        print("  Linha 10: Horários atuais")
        today = datetime.now()
        current_day = today.weekday() + 1
        
        # Horário atual (ônibus no local)
        arrival_now = today - timedelta(minutes=2)  # Chegou há 2 minutos
        departure_now = today + timedelta(minutes=3)  # Sai em 3 minutos
        
        schedule_current = Schedule(
            line_id=10,
            day_week=current_day,
            arrival_time=arrival_now,
            departure_time=departure_now,
            interested_count=0
        )
        session.add(schedule_current)
        
        # Próximo horário
        next_departure = today + timedelta(minutes=30)
        next_arrival = next_departure - timedelta(minutes=5)
        
        schedule_next = Schedule(
            line_id=10,
            day_week=current_day,
            arrival_time=next_arrival,
            departure_time=next_departure,
            interested_count=0
        )
        session.add(schedule_next)
        
        session.commit()
        print("✅ Casos especiais criados!")
        
    except Exception as e:
        session.rollback()
        print(f"❌ Erro ao criar casos especiais: {e}")
    finally:
        session.close()

def main():
    """Função principal"""
    print("🔄 REPOPULANDO BANCO DE DADOS COM HORÁRIOS DIVERSIFICADOS")
    print("=" * 60)
    
    # Limpar schedules existentes
    print("1. Limpando schedules existentes...")
    clear_all_schedules()
    
    # Criar novos schedules diversificados
    print("\n2. Criando novos schedules...")
    create_diverse_schedules()
    
    # Criar casos especiais
    print("\n3. Criando casos especiais para teste...")
    create_special_test_cases()
    
    print("\n" + "=" * 60)
    print("🎉 REPOPULAÇÃO CONCLUÍDA!")
    print("\nDados criados:")
    print("- Linhas 1-8: Horários variados em todos os dias úteis")
    print("- Linha 9: Apenas segunda-feira (teste de dia específico)")
    print("- Linha 10: Horários atuais (teste de ônibus no local)")

if __name__ == "__main__":
    main()
