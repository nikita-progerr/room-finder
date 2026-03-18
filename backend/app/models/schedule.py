from sqlalchemy import String, Integer, ForeignKey, Date, Time, DateTime, Text
from sqlalchemy.orm import Mapped, mapped_column, relationship
from sqlalchemy.sql import func
from datetime import date, time, datetime
from app.core.database import Base


class ScheduleEntry(Base):
    """Запись расписания — одно занятие"""
    __tablename__ = "schedule_entries"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    room_id: Mapped[int] = mapped_column(Integer, ForeignKey("rooms.id"), index=True)

    # Временные параметры
    day_of_week: Mapped[int] = mapped_column(Integer, index=True)
    # 0=Пн, 1=Вт, 2=Ср, 3=Чт, 4=Пт, 5=Сб, 6=Вс
    week_type: Mapped[str] = mapped_column(String(10), default="both")
    # "odd" = нечётная, "even" = чётная, "both" = каждую

    time_start: Mapped[time] = mapped_column(Time, index=True)
    time_end: Mapped[time] = mapped_column(Time)

    # Информация о занятии
    subject: Mapped[str] = mapped_column(String(200))
    teacher: Mapped[str | None] = mapped_column(String(150), nullable=True)
    group_name: Mapped[str | None] = mapped_column(String(100), nullable=True)
    lesson_type: Mapped[str | None] = mapped_column(String(50), nullable=True)
    # lecture, practice, lab, seminar

    # Мета
    source_hash: Mapped[str | None] = mapped_column(String(64), nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime, server_default=func.now())
    updated_at: Mapped[datetime] = mapped_column(
        DateTime, server_default=func.now(), onupdate=func.now()
    )

    # Relationships
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
