from fastapi import APIRouter, Depends, Query, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from typing import Optional

from app.core.database import get_db
from app.schemas.schemas import RoomOut, RoomFreeOut, FreeRoomsQuery, ScheduleEntryOut
from app.services.room_service import find_free_rooms, get_room_schedule
from app.models.room import Room
from sqlalchemy import select

router = APIRouter(prefix="/rooms", tags=["Аудитории"])


@router.get("/free", response_model=list[RoomFreeOut], summary="Найти свободные аудитории")
async def get_free_rooms(
    time_start: Optional[str] = Query(None, example="09:00", description="Начало HH:MM"),
    time_end: Optional[str] = Query(None, example="11:00", description="Конец HH:MM"),
    day_of_week: Optional[int] = Query(None, ge=0, le=6, description="0=Пн, 6=Вс"),
    building: Optional[str] = Query(None, description="Корпус"),
    min_capacity: Optional[int] = Query(None, ge=1, description="Минимальная вместимость"),
    has_projector: Optional[bool] = Query(None),
    has_computers: Optional[bool] = Query(None),
    week_number: Optional[int] = Query(None, ge=1, description="Номер недели"),
    db: AsyncSession = Depends(get_db),
):
    """
    Возвращает список свободных аудиторий.

    - Если `time_start` не указан — используется **текущее время**
    - Если `time_end` не указан — `time_start + 90 минут`
    - Если `day_of_week` не указан — **сегодня**
    """
    query = FreeRoomsQuery(
        time_start=time_start,
        time_end=time_end,
        day_of_week=day_of_week,
        building=building,
        min_capacity=min_capacity,
        has_projector=has_projector,
        has_computers=has_computers,
        week_number=week_number,
    )
    rooms = await find_free_rooms(db, query)
    return rooms


@router.get("/", response_model=list[RoomOut], summary="Все аудитории")
async def get_all_rooms(
    building: Optional[str] = Query(None),
    db: AsyncSession = Depends(get_db),
):
    """Возвращает список всех аудиторий с их характеристиками"""
    stmt = select(Room)
    if building:
        stmt = stmt.where(Room.building == building)
    stmt = stmt.order_by(Room.building, Room.name)
    result = await db.execute(stmt)
    return result.scalars().all()


@router.get("/{room_id}", response_model=RoomOut, summary="Аудитория по ID")
async def get_room(room_id: int, db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(Room).where(Room.id == room_id))
    room = result.scalar_one_or_none()
    if not room:
        raise HTTPException(status_code=404, detail="Аудитория не найдена")
    return room


@router.get("/{room_id}/schedule", response_model=list[ScheduleEntryOut], summary="Расписание аудитории")
async def get_room_schedule_endpoint(
    room_id: int,
    day_of_week: Optional[int] = Query(None, ge=0, le=6),
    db: AsyncSession = Depends(get_db),
):
    """Расписание конкретной аудитории (по дням или весь)"""
    entries = await get_room_schedule(db, room_id, day_of_week)
    return entries
