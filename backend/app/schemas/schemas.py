from pydantic import BaseModel, Field, field_serializer
from typing import Optional, Any
from datetime import time, datetime, date


# ── Building Schemas ──────────────────────────────────────────────────

class BuildingOut(BaseModel):
    model_config = {"from_attributes": True}
    
    id: int
    code: str
    name: str
    address: Optional[str] = None
    is_active: bool


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
    model_config = {"from_attributes": True}

    id: int
    room_id: int
    day_of_week: int
    week_start_date: Optional[date] = None
    week_type: str = "both"
    time_start: time
    time_end: time
    subject: str
    teacher: Optional[str] = None
    teacher_id: Optional[int] = None
    group_name: Optional[str] = None
    lesson_type: Optional[str] = None
    is_recurring: bool = True

    @field_serializer("week_start_date")
    def serialize_date(self, value: Optional[date]) -> Optional[str]:
        if value is None:
            return None
        return value.isoformat()


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
    week_start_date: Optional[str] = Field(None,
        description="Дата начала недели (Пн) в формате YYYY-MM-DD")


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


# ── Schedule Entry Schemas ───────────────────────────────────────────

class ScheduleEntryCreate(BaseModel):
    room_id: int = Field(..., description="ID аудитории")
    day_of_week: int = Field(..., ge=0, le=6, description="0=Пн, 6=Вс")
    week_start_date: Optional[str] = Field(None, description="Дата начала недели (Пн) в формате YYYY-MM-DD")
    time_start: str = Field(..., description="Начало HH:MM")
    time_end: str = Field(..., description="Конец HH:MM")
    subject: str = Field(..., description="Название дисциплины")
    teacher_id: Optional[int] = Field(None, description="ID преподавателя")
    group_name: Optional[str] = Field(None, description="Название группы")
    lesson_type: Optional[str] = Field(None, description="Тип: lecture/practice/lab/seminar")
    is_recurring: bool = Field(default=True, description="Регулярное ли занятие")


class ScheduleEntryUpdate(BaseModel):
    room_id: Optional[int] = Field(None, description="ID аудитории")
    day_of_week: Optional[int] = Field(None, ge=0, le=6, description="0=Пн, 6=Вс")
    week_start_date: Optional[str] = Field(None, description="Дата начала недели (Пн)")
    time_start: Optional[str] = Field(None, description="Начало HH:MM")
    time_end: Optional[str] = Field(None, description="Конец HH:MM")
    subject: Optional[str] = Field(None, description="Название дисциплины")
    teacher_id: Optional[int] = Field(None, description="ID преподавателя")
    group_name: Optional[str] = Field(None, description="Название группы")
    lesson_type: Optional[str] = Field(None, description="Тип: lecture/practice/lab/seminar")
    is_recurring: Optional[bool] = Field(None, description="Регулярное ли занятие")


# ── Teacher Schemas ─────────────────────────────────────────────────

class TeacherOut(BaseModel):
    id: int
    full_name: str
    position: Optional[str] = None
    department: Optional[str] = None
    email: Optional[str] = None
    phone: Optional[str] = None
    is_active: bool = True

    class Config:
        from_attributes = True
