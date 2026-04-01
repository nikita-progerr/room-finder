from sqlalchemy import String, Integer, Boolean, Text, JSON
from sqlalchemy.orm import Mapped, mapped_column, relationship
from app.core.database import Base


class Building(Base):
    """Корпус учебного заведения"""
    __tablename__ = "buildings"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    code: Mapped[str] = mapped_column(String(20), unique=True, index=True)
    name: Mapped[str] = mapped_column(String(100))
    address: Mapped[str | None] = mapped_column(String(255), nullable=True)
    is_active: Mapped[bool] = mapped_column(Boolean, default=True, index=True)

    def __repr__(self):
        return f"<Building {self.code}: {self.name}>"


class Room(Base):
    """Аудитория"""
    __tablename__ = "rooms"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    name: Mapped[str] = mapped_column(String(50), unique=True, index=True)
    building: Mapped[str] = mapped_column(String(20), index=True)
    floor: Mapped[int] = mapped_column(Integer, default=1)
    capacity: Mapped[int] = mapped_column(Integer, default=30)

    # Оборудование
    has_projector: Mapped[bool] = mapped_column(Boolean, default=False)
    has_computers: Mapped[bool] = mapped_column(Boolean, default=False)
    has_whiteboard: Mapped[bool] = mapped_column(Boolean, default=True)
    has_smartboard: Mapped[bool] = mapped_column(Boolean, default=False)

    # Тип аудитории
    room_type: Mapped[str] = mapped_column(String(30), default="classroom")
    # classroom, lab, lecture_hall, seminar

    description: Mapped[str | None] = mapped_column(Text, nullable=True)
    extra_info: Mapped[dict | None] = mapped_column(JSON, nullable=True)

    # Relationships
    schedule_entries = relationship("ScheduleEntry", back_populates="room")

    def __repr__(self):
        return f"<Room {self.name} (cap={self.capacity})>"
