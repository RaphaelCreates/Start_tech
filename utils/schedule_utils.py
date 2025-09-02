#!/usr/bin/env python3
"""
Utilitários para cálculo de datas dos schedules
"""

from datetime import datetime, timedelta
from typing import Tuple

def calculate_schedule_datetime(day_week: int, time_str: str, reference_date: datetime = None) -> Tuple[datetime, datetime]:
    """
    Calcula arrival_time e departure_time baseado no day_week e horário (HH:MM)
    
    Args:
        day_week: Dia da semana (1=segunda, 2=terça, ..., 7=domingo)
        time_str: Horário no formato "HH:MM" (ex: "12:30")
        reference_date: Data de referência (padrão: datetime.now())
    
    Returns:
        Tuple[arrival_time, departure_time]
    """
    if reference_date is None:
        reference_date = datetime.now()
    
    # Parse do horário
    hour, minute = map(int, time_str.split(':'))
    
    # Calcular quantos dias adicionar para chegar no dia da semana correto
    current_weekday = reference_date.weekday() + 1  # Monday = 1
    days_diff = day_week - current_weekday
    
    # Se o dia já passou esta semana, programar para a próxima semana
    if days_diff < 0:
        days_diff += 7
    elif days_diff == 0:
        # Se é hoje, verificar se o horário já passou
        current_time = reference_date.time()
        schedule_time = datetime.strptime(time_str, "%H:%M").time()
        if schedule_time <= current_time:
            # Se já passou, programar para a próxima semana
            days_diff = 7
    
    # Calcular a data do schedule
    target_date = reference_date + timedelta(days=days_diff)
    
    # Criar departure_time
    departure_time = target_date.replace(
        hour=hour, 
        minute=minute, 
        second=0, 
        microsecond=0
    )
    
    # Arrival time: 5 minutos antes
    arrival_time = departure_time - timedelta(minutes=5)
    
    return arrival_time, departure_time

def get_next_occurrence(day_week: int, time_str: str, reference_date: datetime = None) -> datetime:
    """
    Obtém a próxima ocorrência de um horário em um dia específico da semana
    """
    _, departure_time = calculate_schedule_datetime(day_week, time_str, reference_date)
    return departure_time

def is_schedule_in_future(day_week: int, time_str: str, reference_date: datetime = None) -> bool:
    """
    Verifica se um schedule está no futuro
    """
    departure_time = get_next_occurrence(day_week, time_str, reference_date)
    if reference_date is None:
        reference_date = datetime.now()
    return departure_time > reference_date
