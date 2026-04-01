"""
Сервис поиска свободных аудиторий.

Алгоритм определения занятости аудитории:
──────────────────────────────────────────
Аудитория считается ЗАНЯТОЙ в интервал [q_start, q_end], если существует
запись расписания [s_start, s_end] такая, что интервалы ПЕРЕСЕКАЮТСЯ:
    s_start < q_end  AND  s_end > q_start

Аудитория СВОБОДНА, если для неё НЕТ ни одной такой записи в нужный день
с учётом чётности недели.
"""

from datetime import datetime, time, timedelta
from typing import Optional
import json

from sqlalchemy import select, and_, or_, not_, exists
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.room import Room
from app.models.schedule import ScheduleEntry
from app.schemas.schemas import FreeRoomsQuery, RoomFreeOut
from app.core.cache import cache_get, cache_set


DAYS_RU = ["Понедельник", "Вторник", "Среда", "Четверг", "Пятница", "Суббота", "Воскресенье"]


def _parse_time(t_str: str) -> time:
    """Парсит строку 'HH:MM' в объект time"""
    h, m = map(int, t_str.split(":"))
    return time(h, m)


def _get_week_type(week_number: Optional[int]) -> str:
    """Определяет чётность текущей или заданной недели"""
    if week_number is None:
        # Вычисляем номер текущей недели от начала года
        week_number = datetime.now().isocalendar()[1]
    return "odd" if week_number % 2 != 0 else "even"


def _format_time(t: time) -> str:
    return t.strftime("%H:%M")


async def find_free_rooms(
    db: AsyncSession,
    query: FreeRoomsQuery,
) -> list[RoomFreeOut]:
    """
    Основной метод поиска свободных аудиторий.

    1. Определяем временной интервал запроса
    2. Определяем день недели и чётность
    3. SQL: все комнаты WHERE NOT EXISTS занятие, пересекающееся с интервалом
    4. Применяем фильтры (корпус, вместимость, оборудование)
    5. Для каждой свободной комнаты находим "свободна до..."
    """
    now = datetime.now()

    # ── Определяем интервал запроса ──────────────────────────────
    if query.time_start:
        q_start = _parse_time(query.time_start)
    else:
        # Если указан конкретный день недели - используем начало рабочего дня
        # Иначе - текущее время
        if query.day_of_week is not None:
            q_start = time(8, 0)  # 08:00 - начало занятий
        else:
            q_start = now.time().replace(second=0, microsecond=0)

    if query.time_end:
        q_end = _parse_time(query.time_end)
    else:
        # Если указан конкретный день недели - используем конец рабочего дня
        if query.day_of_week is not None:
            q_end = time(20, 0)  # 20:00 - конец занятий
        else:
            # По умолчанию +90 минут
            dt_end = datetime.combine(now.date(), q_start) + timedelta(minutes=90)
            q_end = dt_end.time()

    # ── Определяем день недели ───────────────────────────────────
    day = query.day_of_week if query.day_of_week is not None else now.weekday()

    # ── Чётность недели ─────────────────────────────────────────
    week_type = _get_week_type(query.week_number)

    # ── Кэш ─────────────────────────────────────────────────────
    cache_key = f"free_rooms:{day}:{q_start}:{q_end}:{week_type}:{query.building}:{query.min_capacity}:{query.has_projector}:{query.has_computers}:{query.week_start_date}"
    cached = await cache_get(cache_key)
    if cached:
        return [RoomFreeOut(**r) for r in cached]

    # ── SQL запрос ───────────────────────────────────────────────
    # Подзапрос: аудитории с пересекающимися занятиями
    
    # Условие для фильтрации по неделе
    if query.week_start_date:
        # Фильтр: только конкретная неделя (без повторяющихся)
        from datetime import date
        week_date = date.fromisoformat(query.week_start_date)
        week_condition = ScheduleEntry.week_start_date == week_date
    else:
        # Фильтр по чётности недели (повторяющиеся занятия)
        week_condition = ScheduleEntry.week_type.in_([week_type, "both"])
    
    busy_subquery = (
        select(ScheduleEntry.room_id)
        .where(
            and_(
                ScheduleEntry.day_of_week == day,
                # Пересечение интервалов: s_start < q_end AND s_end > q_start
                ScheduleEntry.time_start < q_end,
                ScheduleEntry.time_end > q_start,
                # Фильтр по неделе
                week_condition,
            )
        )
        .subquery()
    )

    # Основной запрос: свободные аудитории
    stmt = select(Room).where(
        ~Room.id.in_(select(busy_subquery.c.room_id))
    )

    # ── Применяем фильтры ────────────────────────────────────────
    if query.building:
        stmt = stmt.where(Room.building == query.building)
    if query.min_capacity:
        stmt = stmt.where(Room.capacity >= query.min_capacity)
    if query.has_projector is not None:
        stmt = stmt.where(Room.has_projector == query.has_projector)
    if query.has_computers is not None:
        stmt = stmt.where(Room.has_computers == query.has_computers)

    stmt = stmt.order_by(Room.building, Room.floor, Room.name)

    result = await db.execute(stmt)
    rooms = result.scalars().all()

    # ── Обогащаем данные "свободна до..." ────────────────────────
    free_rooms: list[RoomFreeOut] = []
    for room in rooms:
        free_until, next_class_at = await _get_free_until(db, room.id, day, q_start, q_end, week_type, query.week_start_date)
        free_rooms.append(RoomFreeOut(
            **{c.name: getattr(room, c.name) for c in room.__table__.columns},
            free_until=free_until,
            next_class_at=next_class_at,
        ))

    # ── Кэшируем результат ───────────────────────────────────────
    await cache_set(cache_key, [r.model_dump() for r in free_rooms], ttl=30)

    return free_rooms


async def _get_free_until(
    db: AsyncSession,
    room_id: int,
    day: int,
    query_start: time,
    query_end: time,
    week_type: str,
    week_start_date: Optional[str] = None,
) -> tuple[str, Optional[str]]:
    """
    Находит ближайшее занятие после окончания запроса.
    Возвращает: (free_until_str, next_class_str)
    """
    # Условие для фильтрации по неделе
    if week_start_date:
        from datetime import date
        week_date = date.fromisoformat(week_start_date)
        week_condition = ScheduleEntry.week_start_date == week_date
    else:
        week_condition = ScheduleEntry.week_type.in_([week_type, "both"])
    
    # Ищем ближайшее занятие после query_end
    stmt = (
        select(ScheduleEntry)
        .where(
            and_(
                ScheduleEntry.room_id == room_id,
                ScheduleEntry.day_of_week == day,
                ScheduleEntry.time_start >= query_end,
                week_condition,
            )
        )
        .order_by(ScheduleEntry.time_start)
        .limit(1)
    )
    result = await db.execute(stmt)
    next_entry = result.scalar_one_or_none()

    # Проверяем, есть ли занятие, которое пересекается с интервалом запроса
    busy_stmt = (
        select(ScheduleEntry)
        .where(
            and_(
                ScheduleEntry.room_id == room_id,
                ScheduleEntry.day_of_week == day,
                ScheduleEntry.time_start < query_end,
                ScheduleEntry.time_end > query_start,
                week_condition,
            )
        )
        .order_by(ScheduleEntry.time_start)
        .limit(1)
    )
    busy_result = await db.execute(busy_stmt)
    busy_entry = busy_result.scalar_one_or_none()
    
    if busy_entry:
        # Комната занята в течение интервала запроса
        return (f"до {_format_time(busy_entry.time_start)}", _format_time(busy_entry.time_start))
    
    if next_entry:
        return (
            f"до {_format_time(next_entry.time_start)}",
            _format_time(next_entry.time_start),
        )
    return ("весь день", None)


async def get_room_schedule(
    db: AsyncSession,
    room_id: int,
    day_of_week: Optional[int] = None,
    week_start_date: Optional[str] = None,
) -> list[ScheduleEntry]:
    """Расписание конкретной аудитории"""
    from datetime import date
    
    stmt = select(ScheduleEntry).where(ScheduleEntry.room_id == room_id)
    if day_of_week is not None:
        stmt = stmt.where(ScheduleEntry.day_of_week == day_of_week)
    
    if week_start_date:
        week_date = date.fromisoformat(week_start_date)
        stmt = stmt.where(ScheduleEntry.week_start_date == week_date)
    
    stmt = stmt.order_by(ScheduleEntry.day_of_week, ScheduleEntry.time_start)
    result = await db.execute(stmt)
    return list(result.scalars().all())
