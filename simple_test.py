from datetime import datetime
from sqlmodel import Session, create_engine, select
from models.schedule_model import Line, Schedule

# Configuração do banco
DATABASE_URL = "sqlite:///./db.db"
engine = create_engine(DATABASE_URL)

print("🧪 TESTE SIMPLES DO SISTEMA")
print("=" * 40)

now = datetime.now()
print(f"Agora: {now.strftime('%d/%m/%Y %H:%M:%S')}")
print(f"Dia da semana: {now.weekday() + 1}")

with Session(engine) as session:
    # Total de schedules
    total_schedules = session.exec(select(Schedule)).all()
    print(f"Total schedules: {len(total_schedules)}")
    
    # Schedules para hoje
    today_schedules = session.exec(
        select(Schedule).where(Schedule.day_week == now.weekday() + 1)
    ).all()
    print(f"Schedules para hoje: {len(today_schedules)}")
    
    # Schedules futuros para hoje
    future_schedules = [s for s in today_schedules if s.departure_time > now]
    print(f"Schedules futuros: {len(future_schedules)}")
    
    if future_schedules:
        print("✅ PROBLEMA RESOLVIDO!")
        next_schedule = min(future_schedules, key=lambda x: x.departure_time)
        print(f"Próximo: {next_schedule.departure_time.strftime('%H:%M')}")
    else:
        print("❌ Ainda sem schedules")
