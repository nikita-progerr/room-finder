"""
Celery задачи для фонового парсинга расписания.
"""

from celery import Celery
from celery.schedules import crontab
from datetime import datetime
import logging

from app.core.config import settings

logger = logging.getLogger(__name__)

celery_app = Celery(
    "smart_rooms",
    broker=settings.CELERY_BROKER_URL,
    backend=settings.CELERY_RESULT_BACKEND,
)

celery_app.conf.update(
    task_serializer="json",
    accept_content=["json"],
    result_serializer="json",
    timezone="Europe/Moscow",
    enable_utc=False,
    # Расписание задач
    beat_schedule={
        "parse-schedule-every-6-hours": {
            "task": "app.tasks.celery_tasks.parse_and_update_schedule",
            "schedule": crontab(minute=0, hour="*/6"),
        },
    },
)


@celery_app.task(
    name="app.tasks.celery_tasks.parse_and_update_schedule",
    bind=True,
    max_retries=3,
    default_retry_delay=60,
)
def parse_and_update_schedule(self):
    """
    Главная задача: парсинг расписания + сохранение в БД.
    Запускается каждые 6 часов по cron.
    """
    from app.services.parser import run_parser
    from app.tasks.db_sync import sync_lessons_to_db

    logger.info("Starting scheduled parse task")
    started_at = datetime.now()

    try:
        # 1. Парсим расписание
        lessons = run_parser()

        if not lessons:
            logger.info("No new data from parser (unchanged or error)")
            return {"status": "skipped", "reason": "no_changes"}

        # 2. Сохраняем в БД (синхронно через psycopg2)
        stats = sync_lessons_to_db(lessons)

        logger.info(
            f"Parse complete: parsed={len(lessons)}, "
            f"created={stats['created']}, updated={stats['updated']}"
        )
        return {
            "status": "success",
            "parsed": len(lessons),
            "created": stats["created"],
            "updated": stats["updated"],
            "duration_sec": (datetime.now() - started_at).seconds,
        }

    except Exception as exc:
        logger.error(f"Parse task failed: {exc}", exc_info=True)
        self.retry(exc=exc)


@celery_app.task(name="app.tasks.celery_tasks.trigger_parse_now")
def trigger_parse_now():
    """Ручной запуск парсинга (из API)"""
    return parse_and_update_schedule.delay()
