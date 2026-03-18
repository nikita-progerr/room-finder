from fastapi import APIRouter, Depends, BackgroundTasks, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func
from datetime import datetime

from app.core.database import get_db
from app.schemas.schemas import ParseLogOut
from app.models.schedule import ParseLog

router = APIRouter(prefix="/admin", tags=["Администрирование"])


@router.post("/parse/trigger", summary="Запустить парсинг вручную")
async def trigger_parse(background_tasks: BackgroundTasks):
    """
    Запускает принудительное обновление расписания.
    Задача выполняется в фоне через Celery.
    """
    try:
        from app.tasks.celery_tasks import trigger_parse_now
        task = trigger_parse_now.delay()
        return {
            "message": "Парсинг запущен",
            "task_id": str(task.id),
            "started_at": datetime.now().isoformat(),
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Ошибка запуска задачи: {e}")


@router.get("/parse/logs", response_model=list[ParseLogOut], summary="Логи парсинга")
async def get_parse_logs(
    limit: int = 20,
    db: AsyncSession = Depends(get_db),
):
    """Последние N запусков парсера"""
    result = await db.execute(
        select(ParseLog).order_by(ParseLog.started_at.desc()).limit(limit)
    )
    return result.scalars().all()


@router.get("/stats", summary="Статистика системы")
async def get_system_stats(db: AsyncSession = Depends(get_db)):
    """Общая статистика: кол-во аудиторий, занятий, последний парсинг"""
    from app.models.room import Room
    from app.models.schedule import ScheduleEntry

    rooms_count = await db.scalar(select(func.count(Room.id)))
    entries_count = await db.scalar(select(func.count(ScheduleEntry.id)))
    last_log = await db.scalar(
        select(ParseLog).order_by(ParseLog.started_at.desc()).limit(1)
    )

    return {
        "rooms_total": rooms_count,
        "schedule_entries_total": entries_count,
        "last_parse": last_log.started_at.isoformat() if last_log else None,
        "last_parse_status": last_log.status if last_log else None,
    }
