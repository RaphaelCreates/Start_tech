from fastapi import HTTPException
from sqlmodel import select
from core.database import SessionDep
from models import schedule_model
from models.schedule_model import Line
from datetime import datetime, timedelta

def create_schedule(schedule: schedule_model.Schedule, session: SessionDep):
    new_schedule = schedule_model.Schedule(
        line_id=schedule.line_id,
        arrival_time=datetime.now(),
        departure_time=datetime.now(),
        day_week=schedule.day_week
    )
    session.add(new_schedule)
    session.commit()
    session.refresh(new_schedule)
    return new_schedule


def get_schedule(schedule_id: int, session: SessionDep):
    schedule = session.exec(select(schedule_model.Schedule).where(schedule_model.Schedule.id == schedule_id)).first()
    if not schedule:
        raise HTTPException(status_code=404, detail="Schedule not found")
    return schedule


def get_all_schedules(session: SessionDep):
    schedules = session.exec(select(schedule_model.Schedule)).all()
    if not schedules:
        raise HTTPException(status_code=404, detail="No schedules found")
    return schedules


def update_schedule(schedule_id: int, request: schedule_model.Schedule, session: SessionDep):
    db_schedule = session.exec(select(schedule_model.Schedule).where(schedule_model.Schedule.id == schedule_id)).first()
    if not db_schedule:
        raise HTTPException(status_code=404, detail="Schedule not found")
    schedule_data = request.model_dump(exclude_unset=True)
    db_schedule.sqlmodel_update(schedule_data)
    session.add(db_schedule)
    session.commit()
    session.refresh(db_schedule)
    return db_schedule


def update_interest(schedule_id: int, session: SessionDep):
    db_schedule = session.exec(select(schedule_model.Schedule).where(schedule_model.Schedule.id == schedule_id)).first()
    if not db_schedule:
        raise HTTPException(status_code=404, detail="Schedule not found")
    db_schedule.interest += 1
    session.add(db_schedule)
    session.commit()
    session.refresh(db_schedule)
    return db_schedule


def delete_schedule(schedule_id: int, session: SessionDep):
    existing_schedule = session.exec(select(schedule_model.Schedule).where(schedule_model.Schedule.id == schedule_id)).first()
    if not existing_schedule:
        raise HTTPException(status_code=404, detail="Schedule not found")
    session.delete(existing_schedule)
    session.commit()
    return {"detail": "Schedule deleted successfully"}


    return None


def schedule_timer(session: SessionDep, line_id: int):
    """
    Função para verificar status dos horários de uma linha.
    Retorna:
    - true: Ônibus no local (current)
    - false: Próximo horário disponível 
    - null: Sem horários no dia atual
    """
    now = datetime.now()
    current_day = now.weekday() + 1
    
    # Verificar se há schedule atual (ônibus no local)
    current_schedule = get_current_schedule(session, line_id)
    if current_schedule:
        return True  # Ônibus no local
    
    # Verificar se há próximo horário hoje
    next_schedule_today = get_next_schedule(session, line_id, today_only=True)
    if next_schedule_today:
        return False  # Próximo horário disponível
    
    # Sem horários no dia atual
    return None


def get_current_schedule(session: SessionDep, line_id: int = None) -> dict | None:
    # Primeiro, zerar interesse de schedules que já passaram
    reset_interest_for_past_schedules(session)
    
    now = datetime.now()
    current_day = now.weekday() + 1  # Segunda = 1, Terça = 2, etc
    
    # Buscar schedule atual com informações da linha
    statement = select(schedule_model.Schedule, Line).join(Line).where(
        schedule_model.Schedule.day_week == current_day
    ).where(
        schedule_model.Schedule.arrival_time <= now
    ).where(
        schedule_model.Schedule.departure_time >= now
    )
    
    # Filtrar por linha específica se line_id foi fornecido
    if line_id:
        statement = statement.where(schedule_model.Schedule.line_id == line_id)
    
    result = session.exec(statement).first()
    if result:
        schedule, line = result
        return {
            "id": schedule.id,
            "line_name": line.name,
            "arrival_time": schedule.arrival_time.strftime("%H:%M"),
            "departure_time": schedule.departure_time.strftime("%H:%M"),
            "departure_datetime": schedule.departure_time.isoformat(),
            "day_week": schedule.day_week,
            "interest": schedule.interest,
            "is_current": True
        }
    return None


def get_next_schedule(session: SessionDep, line_id: int = None, today_only: bool = False) -> dict | None:
    now = datetime.now()
    current_day = now.weekday() + 1  # Segunda = 1, Terça = 2, etc

    # Primeiro, procura horários do dia atual que ainda não passaram
    statement = select(schedule_model.Schedule, Line).join(Line).where(
        schedule_model.Schedule.day_week == current_day
    ).where(
        schedule_model.Schedule.arrival_time > now
    ).order_by(schedule_model.Schedule.arrival_time)
    
    # Filtrar por linha específica se line_id foi fornecido
    if line_id:
        statement = statement.where(schedule_model.Schedule.line_id == line_id)
    
    result = session.exec(statement).first()
    if result:
        schedule, line = result
        # Calcular tempo até o próximo ônibus
        time_until = schedule.arrival_time - now
        minutes_until = int(time_until.total_seconds() // 60)
        
        return {
            "id": schedule.id,
            "line_name": line.name,
            "arrival_time": schedule.arrival_time.strftime("%H:%M"),
            "departure_time": schedule.departure_time.strftime("%H:%M"),
            "departure_datetime": schedule.departure_time.isoformat(),
            "day_week": schedule.day_week,
            "interest": schedule.interest,
            "minutes_until": minutes_until,
            "is_current": False
        }

    # Se today_only=True, não buscar em outros dias
    if today_only:
        return None

    # Se não há mais horários hoje, procura o primeiro do próximo dia com horários
    for next_day_offset in range(1, 8):  # próximos 7 dias
        day_to_check = ((current_day - 1 + next_day_offset) % 7) + 1
        
        statement = select(schedule_model.Schedule, Line).join(Line).where(
            schedule_model.Schedule.day_week == day_to_check
        ).order_by(schedule_model.Schedule.arrival_time)
        
        # CORREÇÃO: Filtrar por linha específica se line_id foi fornecido
        if line_id:
            statement = statement.where(schedule_model.Schedule.line_id == line_id)
        
        result = session.exec(statement).first()
        if result:
            schedule, line = result
            return {
                "id": schedule.id,
                "line_name": line.name,
                "arrival_time": schedule.arrival_time.strftime("%H:%M"),
                "departure_time": schedule.departure_time.strftime("%H:%M"),
                "departure_datetime": schedule.departure_time.isoformat(),
                "day_week": schedule.day_week,
                "interest": schedule.interest,
                "minutes_until": None,  # Será calculado no próximo dia
                "is_current": False
            }
    
    return None


def get_schedule_by_line_and_time(session: SessionDep, line_id: int, departure_time: str):
    """Busca um schedule específico por linha e horário"""
    try:
        # Buscar schedule que corresponde à linha e horário
        statement = select(schedule_model.Schedule).where(
            schedule_model.Schedule.line_id == line_id
        )
        
        # Buscar por schedules que tenham o horário correspondente
        schedules = session.exec(statement).all()
        
        for schedule in schedules:
            # Converter o horário do schedule para HH:MM para comparação
            schedule_time = schedule.departure_time.strftime("%H:%M")
            if schedule_time == departure_time:
                return {
                    "id": schedule.id,
                    "line_id": schedule.line_id,
                    "departure_time": schedule_time,
                    "interest": schedule.interest,
                    "day_week": schedule.day_week
                }
        
        return None
    except Exception as e:
        print(f"Erro ao buscar schedule: {e}")
        return None


def reset_interest_for_past_schedules(session: SessionDep):
    """Zera o interesse de schedules cujo departure time já passou"""
    try:
        now = datetime.now()
        current_day = now.weekday() + 1
        
        # Buscar schedules do dia atual que já passaram e têm interesse > 0
        statement = select(schedule_model.Schedule).where(
            schedule_model.Schedule.day_week == current_day
        ).where(
            schedule_model.Schedule.departure_time < now
        ).where(
            schedule_model.Schedule.interest > 0
        )
        
        past_schedules = session.exec(statement).all()
        
        for schedule in past_schedules:
            schedule.interest = 0
            session.add(schedule)
        
        if past_schedules:
            session.commit()
            print(f"Zerando interesse de {len(past_schedules)} schedules que já passaram")
        
        return len(past_schedules)
    except Exception as e:
        print(f"Erro ao zerar interesse de schedules passados: {e}")
        return 0


def can_register_interest(session: SessionDep, line_id: int, departure_time: str):
    """Verifica se é possível registrar interesse (apenas para horário atual ou próximo)"""
    try:
        now = datetime.now()
        current_day = now.weekday() + 1  # Segunda = 1, Terça = 2, etc
        
        # Buscar todos os schedules do dia atual para esta linha
        statement = select(schedule_model.Schedule).where(
            schedule_model.Schedule.line_id == line_id,
            schedule_model.Schedule.day_week == current_day
        ).order_by(schedule_model.Schedule.departure_time)
        
        schedules = session.exec(statement).all()
        
        # Encontrar o schedule solicitado
        target_schedule = None
        for schedule in schedules:
            schedule_time = schedule.departure_time.strftime("%H:%M")
            if schedule_time == departure_time:
                target_schedule = schedule
                break
        
        if not target_schedule:
            return False  # Horário não encontrado
        
        # REGRA 1: Se o horário já passou, não pode registrar interesse
        if target_schedule.departure_time <= now:
            return False
        
        # REGRA 2: Só pode registrar interesse no próximo horário disponível
        future_schedules = [s for s in schedules if s.departure_time > now]
        
        if not future_schedules:
            return False  # Nenhum horário futuro disponível
        
        # O próximo horário disponível
        next_schedule = min(future_schedules, key=lambda x: x.departure_time)
        
        # REGRA 3: Só pode registrar se for o próximo horário OU se estiver chegando (dentro de 5 min do arrival)
        if target_schedule.id == next_schedule.id:
            return True  # É o próximo horário
        
        # REGRA 4: Verificar se é o horário atual (ônibus chegando)
        arrival_time = target_schedule.departure_time - timedelta(minutes=5)
        if arrival_time <= now <= target_schedule.departure_time:
            return True  # Ônibus está chegando/no local
        
        return False  # Não é o próximo nem o atual
        
    except Exception as e:
        print(f"Erro ao verificar possibilidade de registro: {e}")
        return False


def register_interest(session: SessionDep, line_id: int, departure_time: str):
    """Incrementa o interesse para um schedule específico (apenas horário atual ou próximo)"""
    try:
        # Primeiro, zerar interesse de schedules que já passaram
        reset_interest_for_past_schedules(session)
        
        # Verificar se é possível registrar interesse neste horário
        if not can_register_interest(session, line_id, departure_time):
            return {"error": "Só é possível registrar interesse no horário atual ou próximo"}
        
        # Buscar o schedule correspondente
        statement = select(schedule_model.Schedule).where(
            schedule_model.Schedule.line_id == line_id
        )
        
        schedules = session.exec(statement).all()
        
        for schedule in schedules:
            # Converter o horário do schedule para HH:MM para comparação
            schedule_time = schedule.departure_time.strftime("%H:%M")
            if schedule_time == departure_time:
                # Incrementar interesse
                schedule.interest += 1
                session.add(schedule)
                session.commit()
                session.refresh(schedule)
                
                return {
                    "id": schedule.id,
                    "line_id": schedule.line_id,
                    "departure_time": schedule_time,
                    "interest": schedule.interest,
                    "day_week": schedule.day_week,
                    "message": "Interesse registrado com sucesso!"
                }
        
        return {"error": "Schedule não encontrado"}
    except Exception as e:
        print(f"Erro ao registrar interesse: {e}")
        return {"error": f"Erro interno: {str(e)}"}
