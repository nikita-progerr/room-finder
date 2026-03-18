"""
Синхронная запись результатов парсинга в БД.
Используется внутри Celery задач (синхронный контекст).
"""

import psycopg2
import logging
from datetime import datetime
from app.core.config import settings

logger = logging.getLogger(__name__)


def sync_lessons_to_db(lessons: list[dict]) -> dict:
    """
    Сохраняет или обновляет занятия в БД.
    Возвращает статистику: {created, updated}
    """
    conn = psycopg2.connect(settings.DATABASE_URL_SYNC)
    cur = conn.cursor()
    created = 0
    updated = 0

    try:
        for lesson in lessons:
            room_name = lesson.get("room_name", "").strip().upper()
            if not room_name or room_name == "UNKNOWN":
                continue

            # Получаем или создаём аудиторию
            cur.execute("SELECT id FROM rooms WHERE name = %s", (room_name,))
            row = cur.fetchone()
            if row:
                room_id = row[0]
            else:
                cur.execute(
                    """INSERT INTO rooms (name, building, floor, capacity)
                       VALUES (%s, %s, %s, %s) RETURNING id""",
                    (room_name, _infer_building(room_name), 1, 30),
                )
                room_id = cur.fetchone()[0]
                created += 1

            # Проверяем существующую запись
            cur.execute(
                """SELECT id FROM schedule_entries
                   WHERE room_id=%s AND day_of_week=%s AND time_start=%s AND week_type=%s""",
                (room_id, lesson["day_of_week"], lesson["time_start"], lesson.get("week_type", "both")),
            )
            existing = cur.fetchone()

            if existing:
                cur.execute(
                    """UPDATE schedule_entries
                       SET subject=%s, teacher=%s, group_name=%s, lesson_type=%s,
                           time_end=%s, updated_at=NOW()
                       WHERE id=%s""",
                    (
                        lesson.get("subject"),
                        lesson.get("teacher"),
                        lesson.get("group_name"),
                        lesson.get("lesson_type"),
                        lesson.get("time_end"),
                        existing[0],
                    ),
                )
                updated += 1
            else:
                cur.execute(
                    """INSERT INTO schedule_entries
                       (room_id, day_of_week, week_type, time_start, time_end,
                        subject, teacher, group_name, lesson_type)
                       VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s)""",
                    (
                        room_id,
                        lesson["day_of_week"],
                        lesson.get("week_type", "both"),
                        lesson["time_start"],
                        lesson["time_end"],
                        lesson.get("subject", "Занятие"),
                        lesson.get("teacher"),
                        lesson.get("group_name"),
                        lesson.get("lesson_type"),
                    ),
                )
                created += 1

        # Логируем запуск парсера
        cur.execute(
            """INSERT INTO parse_logs (started_at, finished_at, status, entries_parsed, entries_created, entries_updated)
               VALUES (%s, NOW(), 'success', %s, %s, %s)""",
            (datetime.now(), len(lessons), created, updated),
        )

        conn.commit()
        logger.info(f"DB sync complete: created={created}, updated={updated}")

    except Exception as e:
        conn.rollback()
        logger.error(f"DB sync error: {e}", exc_info=True)
        # Логируем ошибку
        try:
            cur.execute(
                """INSERT INTO parse_logs (started_at, finished_at, status, error_message)
                   VALUES (%s, NOW(), 'error', %s)""",
                (datetime.now(), str(e)),
            )
            conn.commit()
        except Exception:
            pass
        raise
    finally:
        cur.close()
        conn.close()

    return {"created": created, "updated": updated}


def _infer_building(room_name: str) -> str:
    """Определяет корпус по номеру аудитории (эвристика)"""
    if room_name.startswith("А") or room_name.startswith("A"):
        return "А"
    if room_name.startswith("Б") or room_name.startswith("B"):
        return "Б"
    if len(room_name) > 0 and room_name[0].isdigit():
        num = int(room_name[0])
        if num <= 3:
            return "Главный"
    return "Главный"
