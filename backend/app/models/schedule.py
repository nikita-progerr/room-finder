from sqlalchemy import String, Integer, ForeignKey, Date, Time, DateTime, Text, Boolean
from sqlalchemy.orm import Mapped, mapped_column, relationship
from sqlalchemy.sql import func
from datetime import date, time, datetime
from typing import TYPE_CHECKING, Optional
from app.core.database import Base

if TYPE_CHECKING:
    from app.models.room import Room


class TimeSlot(Base):
    """Временной слот (академический час)"""
    __tablename__ = "time_slots"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    slot_number: Mapped[int] = mapped_column(Integer, unique=True, index=True)
    time_start: Mapped[time] = mapped_column(Time, index=True)
    time_end: Mapped[time] = mapped_column(Time, index=True)
    label: Mapped[str | None] = mapped_column(String(50), nullable=True)
    duration_type: Mapped[str] = mapped_column(String(20), default="standard")
    is_active: Mapped[bool] = mapped_column(Boolean, default=True)

    def __repr__(self):
        return f"<TimeSlot {self.slot_number}: {self.time_start}-{self.time_end}>"


class LessonType(Base):
    """Тип занятия (лекция, практика и т.д.)"""
    __tablename__ = "lesson_types"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    code: Mapped[str] = mapped_column(String(50), unique=True, index=True)
    name: Mapped[str] = mapped_column(String(100))
    short_name: Mapped[str | None] = mapped_column(String(20), nullable=True)
    color: Mapped[str | None] = mapped_column(String(7), nullable=True)

    def __repr__(self):
        return f"<LessonType {self.code}>"


class Teacher(Base):
    """Преподаватель"""
    __tablename__ = "teachers"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    full_name: Mapped[str] = mapped_column(String(150), unique=True, index=True)
    position: Mapped[str | None] = mapped_column(String(100), nullable=True)
    department: Mapped[str | None] = mapped_column(String(100), nullable=True)
    email: Mapped[str | None] = mapped_column(String(100), nullable=True)
    phone: Mapped[str | None] = mapped_column(String(20), nullable=True)
    is_active: Mapped[bool] = mapped_column(Boolean, default=True)

    def __repr__(self):
        return f"<Teacher {self.full_name}>"


class ScheduleEntry(Base):
    """Запись расписания — одно занятие"""
    __tablename__ = "schedule_entries"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    room_id: Mapped[int] = mapped_column(Integer, ForeignKey("rooms.id"), index=True)
    teacher_id: Mapped[int | None] = mapped_column(Integer, ForeignKey("teachers.id"), nullable=True)

    day_of_week: Mapped[int] = mapped_column(Integer, index=True)
    week_start_date: Mapped[date | None] = mapped_column(Date, nullable=True, index=True)
    week_type: Mapped[str] = mapped_column(String(10), default="both")

    time_start: Mapped[time] = mapped_column(Time, index=True)
    time_end: Mapped[time] = mapped_column(Time)

    time_slot_id: Mapped[int | None] = mapped_column(
        Integer, ForeignKey("time_slots.id"), nullable=True
    )
    lesson_type_id: Mapped[int | None] = mapped_column(
        Integer, ForeignKey("lesson_types.id"), nullable=True
    )

    date: Mapped[date | None] = mapped_column(Date, nullable=True)
    is_recurring: Mapped[bool] = mapped_column(Boolean, default=True)

    subject: Mapped[str] = mapped_column(String(200))
    teacher: Mapped[str | None] = mapped_column(String(150), nullable=True)
    group_name: Mapped[str | None] = mapped_column(String(100), nullable=True)
    lesson_type: Mapped[str | None] = mapped_column(String(50), nullable=True)

    source_hash: Mapped[str | None] = mapped_column(String(64), nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime, server_default=func.now())
    updated_at: Mapped[datetime] = mapped_column(
        DateTime, server_default=func.now(), onupdate=func.now()
    )

    room = relationship("Room", back_populates="schedule_entries")

    def __repr__(self):
        return f"<ScheduleEntry room={self.room_id} day={self.day_of_week} {self.time_start}-{self.time_end}>"


class ParseLog(Base):
    """Лог запусков парсера"""
    __tablename__ = "parse_logs"

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    started_at: Mapped[datetime] = mapped_column(DateTime)
    finished_at: Mapped[datetime | None] = mapped_column(DateTime, nullable=True)
    status: Mapped[str] = mapped_column(String(20))  # success, error, partial
    entries_parsed: Mapped[int] = mapped_column(Integer, default=0)
    entries_created: Mapped[int] = mapped_column(Integer, default=0)
    entries_updated: Mapped[int] = mapped_column(Integer, default=0)
    error_message: Mapped[str | None] = mapped_column(Text, nullable=True)
