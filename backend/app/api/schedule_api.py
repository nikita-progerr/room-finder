from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, delete
from typing import Optional
from datetime import time, date

from app.core.database import get_db
from app.models.schedule import ScheduleEntry, Teacher
from app.models.room import Room
from app.schemas.schemas import (
    ScheduleEntryCreate,
    ScheduleEntryUpdate,
    ScheduleEntryOut,
    TeacherOut,
)

router = APIRouter(prefix="/schedule", tags=["Расписание"])


def _parse_time(t_str: str) -> time:
    """Парсит строку 'HH:MM' в объект time"""
    h, m = map(int, t_str.split(":"))
    return time(h, m)


def _parse_date(d_str: Optional[str]) -> Optional[date]:
    """Парсит строку 'YYYY-MM-DD' в объект date"""
    if not d_str:
        return None
    parts = d_str.split("-")
    return date(int(parts[0]), int(parts[1]), int(parts[2]))


@router.post("/entries", response_model=ScheduleEntryOut, summary="Добавить занятие")
async def create_schedule_entry(
    entry: ScheduleEntryCreate,
    db: AsyncSession = Depends(get_db),
):
    """Создаёт новую запись расписания"""
    result = await db.execute(select(Room.id).where(Room.id == entry.room_id))
    room = result.scalar_one_or_none()
    if not room:
        raise HTTPException(status_code=404, detail="Аудитория не найдена")

    db_entry = ScheduleEntry(
        room_id=entry.room_id,
        day_of_week=entry.day_of_week,
        week_start_date=_parse_date(entry.week_start_date),
        time_start=_parse_time(entry.time_start),
        time_end=_parse_time(entry.time_end),
        subject=entry.subject,
        group_name=entry.group_name,
        lesson_type=entry.lesson_type,
        is_recurring=entry.is_recurring,
    )
    
    if entry.teacher_id:
        db_entry.teacher_id = entry.teacher_id
        teacher = await db.get(Teacher, entry.teacher_id)
        if teacher:
            db_entry.teacher = teacher.full_name

    db.add(db_entry)
    await db.commit()
    await db.refresh(db_entry)
    return db_entry


@router.post("/entries/bulk", summary="Добавить несколько занятий")
async def create_bulk_schedule_entries(
    entries: list[ScheduleEntryCreate],
    db: AsyncSession = Depends(get_db),
):
    """Создаёт несколько записей расписания за раз"""
    created = 0
    errors = []

    for i, entry in enumerate(entries):
        try:
            room = await db.get(Room, entry.room_id)
            if not room:
                errors.append({"index": i, "error": f"Аудитория {entry.room_id} не найдена"})
                continue

            db_entry = ScheduleEntry(
                room_id=entry.room_id,
                teacher_id=entry.teacher_id,
                day_of_week=entry.day_of_week,
                week_start_date=_parse_date(entry.week_start_date),
                time_start=_parse_time(entry.time_start),
                time_end=_parse_time(entry.time_end),
                subject=entry.subject,
                group_name=entry.group_name,
                lesson_type=entry.lesson_type,
                is_recurring=entry.is_recurring,
            )
            db.add(db_entry)
            created += 1
        except Exception as e:
            errors.append({"index": i, "error": str(e)})

    await db.commit()

    return {
        "created": created,
        "errors": errors if errors else None,
    }


@router.get("/entries", response_model=list[ScheduleEntryOut], summary="Все занятия")
async def get_all_entries(
    day_of_week: Optional[int] = Query(None, ge=0, le=6),
    room_id: Optional[int] = Query(None),
    group_name: Optional[str] = Query(None),
    db: AsyncSession = Depends(get_db),
):
    """Получить все записи расписания с фильтрами"""
    stmt = select(ScheduleEntry)

    if day_of_week is not None:
        stmt = stmt.where(ScheduleEntry.day_of_week == day_of_week)
    if room_id:
        stmt = stmt.where(ScheduleEntry.room_id == room_id)
    if group_name:
        stmt = stmt.where(ScheduleEntry.group_name.ilike(f"%{group_name}%"))

    stmt = stmt.order_by(ScheduleEntry.day_of_week, ScheduleEntry.time_start)
    result = await db.execute(stmt)
    return result.scalars().all()


@router.delete("/entries/{entry_id}", summary="Удалить занятие")
async def delete_schedule_entry(
    entry_id: int,
    db: AsyncSession = Depends(get_db),
):
    """Удаляет запись расписания"""
    entry = await db.get(ScheduleEntry, entry_id)
    if not entry:
        raise HTTPException(status_code=404, detail="Занятие не найдено")

    await db.delete(entry)
    await db.commit()
    return {"message": "Занятие удалено"}


@router.patch("/entries/{entry_id}", response_model=ScheduleEntryOut, summary="Обновить занятие")
async def update_schedule_entry(
    entry_id: int,
    entry_update: ScheduleEntryUpdate,
    db: AsyncSession = Depends(get_db),
):
    """Обновляет запись расписания"""
    entry = await db.get(ScheduleEntry, entry_id)
    if not entry:
        raise HTTPException(status_code=404, detail="Занятие не найдено")

    if entry_update.room_id is not None:
        entry.room_id = entry_update.room_id
    if entry_update.day_of_week is not None:
        entry.day_of_week = entry_update.day_of_week
    if entry_update.week_start_date is not None:
        entry.week_start_date = _parse_date(entry_update.week_start_date)
    if entry_update.time_start is not None:
        entry.time_start = _parse_time(entry_update.time_start)
    if entry_update.time_end is not None:
        entry.time_end = _parse_time(entry_update.time_end)
    if entry_update.subject is not None:
        entry.subject = entry_update.subject
    if entry_update.group_name is not None:
        entry.group_name = entry_update.group_name
    if entry_update.lesson_type is not None:
        entry.lesson_type = entry_update.lesson_type
    if entry_update.is_recurring is not None:
        entry.is_recurring = entry_update.is_recurring
    if entry_update.teacher_id is not None:
        entry.teacher_id = entry_update.teacher_id
        if entry_update.teacher_id:
            teacher = await db.get(Teacher, entry_update.teacher_id)
            if teacher:
                entry.teacher = teacher.full_name
        else:
            entry.teacher = None

    await db.commit()
    await db.refresh(entry)
    return entry


@router.delete("/entries/room/{room_id}", summary="Удалить всё расписание аудитории")
async def delete_room_schedule(
    room_id: int,
    db: AsyncSession = Depends(get_db),
):
    """Удаляет все записи расписания для аудитории"""
    await db.execute(delete(ScheduleEntry).where(ScheduleEntry.room_id == room_id))
    await db.commit()
    return {"message": f"Расписание аудитории {room_id} очищено"}


# ── Teachers ──────────────────────────────────────────────────────

@router.get("/teachers", response_model=list[TeacherOut], summary="Все преподаватели")
async def get_all_teachers(
    search: Optional[str] = Query(None, description="Поиск по ФИО"),
    db: AsyncSession = Depends(get_db),
):
    """Получить список преподавателей"""
    stmt = select(Teacher).where(Teacher.is_active == True)

    if search:
        stmt = stmt.where(Teacher.full_name.ilike(f"%{search}%"))

    stmt = stmt.order_by(Teacher.full_name)
    result = await db.execute(stmt)
    return result.scalars().all()


@router.post("/teachers", response_model=TeacherOut, summary="Добавить преподавателя")
async def create_teacher(
    full_name: str,
    position: Optional[str] = None,
    department: Optional[str] = None,
    db: AsyncSession = Depends(get_db),
):
    """Создаёт нового преподавателя"""
    existing = await db.execute(
        select(Teacher).where(Teacher.full_name == full_name)
    )
    if existing.scalar_one_or_none():
        raise HTTPException(status_code=400, detail="Преподаватель уже существует")

    teacher = Teacher(
        full_name=full_name,
        position=position,
        department=department,
    )
    db.add(teacher)
    await db.commit()
    await db.refresh(teacher)
    return teacher
