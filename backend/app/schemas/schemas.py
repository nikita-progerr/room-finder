from pydantic import BaseModel, Field
from typing import Optional
from datetime import time, datetime


# ── Room Schemas ──────────────────────────────────────────────────

class RoomBase(BaseModel):
    name: str
    building: str
    floor: int = 1
    capacity: int = 30
    has_projector: bool = False
    has_computers: bool = False
    has_whiteboard: bool = True
    has_smartboard: bool = False
    room_type: str = "classroom"
    description: Optional[str] = None


class RoomCreate(RoomBase):
    pass


class RoomOut(RoomBase):
    id: int

    class Config:
        from_attributes = True


class RoomFreeOut(RoomOut):
    """Свободная аудитория с дополнительными метаданными"""
    free_until: Optional[str] = None   # "до 14:30" или "весь день"
    next_class_at: Optional[str] = None


# ── Schedule Schemas ──────────────────────────────────────────────

class ScheduleEntryOut(BaseModel):
    id: int
    room_id: int
    day_of_week: int
    week_type: str
    time_start: time
    time_end: time
    subject: str
    teacher: Optional[str] = None
    group_name: Optional[str] = None
    lesson_type: Optional[str] = None

    class Config:
        from_attributes = True


# ── Search / Filter Schemas ───────────────────────────────────────

class FreeRoomsQuery(BaseModel):
    """Параметры поиска свободных аудиторий"""
    time_start: Optional[str] = Field(None, example="09:00",
        description="Начало интервала HH:MM. Если None — текущее время")
    time_end: Optional[str] = Field(None, example="11:00",
        description="Конец интервала HH:MM. Если None — +90 минут от time_start")
    day_of_week: Optional[int] = Field(None, ge=0, le=6,
        description="0=Пн…6=Вс. Если None — сегодня")
    building: Optional[str] = None
    min_capacity: Optional[int] = Field(None, ge=1)
    has_projector: Optional[bool] = None
    has_computers: Optional[bool] = None
    week_number: Optional[int] = Field(None, ge=1,
        description="Номер недели семестра. Если None — текущая")


# ── Analytics Schemas ─────────────────────────────────────────────

class RoomUsageStats(BaseModel):
    room_id: int
    room_name: str
    total_hours_per_week: float
    utilization_percent: float
    busiest_day: Optional[str] = None


class ParseLogOut(BaseModel):
    id: int
    started_at: datetime
    finished_at: Optional[datetime]
    status: str
    entries_parsed: int
    entries_created: int
    entries_updated: int
    error_message: Optional[str]

    class Config:
        from_attributes = True
