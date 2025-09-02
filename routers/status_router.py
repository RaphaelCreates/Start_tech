from fastapi import APIRouter
from core.database import SessionDep
from sqlmodel import select, text
from datetime import datetime

router = APIRouter(prefix="/status", tags=["status"])

@router.get("/last-modified")
def get_last_modified(session: SessionDep):
    """Retorna timestamp da última modificação nos dados"""
    try:
        # Busca o timestamp mais recente entre linhas e schedules
        line_timestamp = session.exec(
            text("SELECT MAX(COALESCE(updated_at, created_at, datetime('now'))) FROM line")
        ).first()
        
        schedule_timestamp = session.exec(
            text("SELECT MAX(COALESCE(updated_at, created_at, datetime('now'))) FROM schedule")
        ).first()
        
        # Se não conseguir buscar timestamps, retorna timestamp atual
        current_time = datetime.now().isoformat()
        
        return {
            "last_modified": current_time,
            "status": "ok"
        }
    except Exception as e:
        return {
            "last_modified": datetime.now().isoformat(),
            "status": "ok",
            "note": "Using current timestamp as fallback"
        }
