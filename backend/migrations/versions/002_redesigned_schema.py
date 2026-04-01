"""redesigned_schema_v2

Revision ID: 002_redesigned_schema
Create Date: 2026-03-19 00:00:00

Переработанная структура БД для проекта "Умный поиск свободных аудиторий":
- Нормализация корпусов (buildings)
- Нормализация временных слотов (time_slots)
- Оптимизированные составные индексы для запросов свободных аудиторий
- Расширенная поддержка типов занятий и оборудования
"""

from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

revision = "002_redesigned_schema"
down_revision = "001_initial"
branch_labels = None
depends_on = None


def upgrade():
    # ═══════════════════════════════════════════════════════════════
    # ТАБЛИЦА КОРПУСОВ (НОРМАЛИЗАЦИЯ)
    # ═══════════════════════════════════════════════════════════════
    op.create_table(
        "buildings",
        sa.Column("id", sa.Integer, primary_key=True),
        sa.Column("code", sa.String(20), nullable=False, unique=True),
        sa.Column("name", sa.String(100), nullable=False),
        sa.Column("address", sa.String(255), nullable=True),
        sa.Column("latitude", sa.Float(precision=10), nullable=True),
        sa.Column("longitude", sa.Float(precision=10), nullable=True),
        sa.Column("is_active", sa.Boolean, default=True),
        sa.Column("created_at", sa.DateTime, server_default=sa.func.now()),
        sa.Column("updated_at", sa.DateTime, server_default=sa.func.now(), onupdate=sa.func.now()),
    )
    op.create_index("ix_buildings_code", "buildings", ["code"], unique=True)
    op.create_index("ix_buildings_active", "buildings", ["is_active"])

    # Seed данные корпусов
    op.execute("""
        INSERT INTO buildings (code, name, address) VALUES
            ('main', 'Главный корпус', 'ул. Главная, 1'),
            ('a', 'Корпус А', 'ул. Корпусная, 2'),
            ('b', 'Корпус Б', 'ул. Учебная, 3')
    """)

    # ═══════════════════════════════════════════════════════════════
    # ТАБЛИЦА ВРЕМЕННЫХ СЛОТОВ (НОРМАЛИЗАЦИЯ)
    # Позволяет стандартизировать время занятий
    # ═══════════════════════════════════════════════════════════════
    op.create_table(
        "time_slots",
        sa.Column("id", sa.Integer, primary_key=True),
        sa.Column("slot_number", sa.Integer, nullable=False, unique=True),
        sa.Column("time_start", sa.Time, nullable=False),
        sa.Column("time_end", sa.Time, nullable=False),
        sa.Column("label", sa.String(50), nullable=True),
        # standard = стандартная пара (90 мин), short = сокращённая (45 мин)
        sa.Column("duration_type", sa.String(20), default="standard"),
        sa.Column("is_active", sa.Boolean, default=True),
    )
    op.create_index("ix_time_slots_start", "time_slots", ["time_start"])
    op.create_index("ix_time_slots_end", "time_slots", ["time_end"])

    # Seed типичных временных слотов (академические часы)
    op.execute("""
        INSERT INTO time_slots (slot_number, time_start, time_end, label, duration_type) VALUES
            (1, '08:00', '09:30', '1 пара', 'standard'),
            (2, '09:45', '11:15', '2 пара', 'standard'),
            (3, '11:30', '13:00', '3 пара', 'standard'),
            (4, '13:30', '15:00', '4 пара', 'standard'),
            (5, '15:15', '16:45', '5 пара', 'standard'),
            (6, '17:00', '18:30', '6 пара', 'standard'),
            (7, '18:45', '20:15', '7 пара', 'standard'),
            (8, '20:30', '22:00', '8 пара', 'standard')
    """)

    # ═══════════════════════════════════════════════════════════════
    # ОБНОВЛЁННАЯ ТАБЛИЦА АУДИТОРИЙ
    # ═══════════════════════════════════════════════════════════════
    # Добавляем FK на buildings
    op.add_column("rooms", sa.Column("building_id", sa.Integer, sa.ForeignKey("buildings.id"), nullable=True))
    
    # Конвертируем старые данные building -> building_id
    op.execute("""
        UPDATE rooms SET building_id = 
            CASE building
                WHEN 'Главный' THEN (SELECT id FROM buildings WHERE code = 'main')
                WHEN 'А' THEN (SELECT id FROM buildings WHERE code = 'a')
                WHEN 'Б' THEN (SELECT id FROM buildings WHERE code = 'b')
                ELSE (SELECT id FROM buildings WHERE code = 'main')
            END
    """)
    
    # Делаем building_id NOT NULL после миграции данных
    op.alter_column("rooms", "building_id", nullable=False)
    
    # Удаляем старый столбец building (текстовый)
    op.drop_column("rooms", "building")
    
    # Добавляем индекс для быстрой фильтрации по корпусу
    op.create_index("ix_rooms_building_id", "rooms", ["building_id"])
    
    # Создаём составной индекс для типичных запросов
    op.create_index("ix_rooms_building_capacity", "rooms", ["building_id", "capacity"])

    # ═══════════════════════════════════════════════════════════════
    # ОБНОВЛЁННАЯ ТАБЛИЦА РАСПИСАНИЯ
    # ═══════════════════════════════════════════════════════════════
    # Добавляем FK на time_slots (опционально, для нормализации)
    op.add_column("schedule_entries", sa.Column("time_slot_id", sa.Integer, sa.ForeignKey("time_slots.id"), nullable=True))
    
    # Добавляем поле для даты (для разовых мероприятий)
    op.add_column("schedule_entries", sa.Column("date", sa.Date, nullable=True))
    
    # Добавляем признак регулярности занятия
    op.add_column("schedule_entries", sa.Column("is_recurring", sa.Boolean, default=True))
    
    # Оптимизированные составные индексы для запросов свободных аудиторий
    # Это КЛЮЧЕВОЙ индекс для производительности!
    op.create_index(
        "ix_schedule_room_day_time",
        "schedule_entries",
        ["room_id", "day_of_week", "time_start", "time_end"],
    )
    
    # Индекс для поиска по чётности недели
    op.create_index(
        "ix_schedule_week_type",
        "schedule_entries",
        ["day_of_week", "week_type"],
    )
    
    # Составной индекс для типичного запроса "свободные аудитории"
    op.create_index(
        "ix_schedule_availability_query",
        "schedule_entries",
        ["day_of_week", "time_start", "time_end", "week_type"],
    )

    # ═══════════════════════════════════════════════════════════════
    # ТАБЛИЦА ТИПОВ ЗАНЯТИЙ (НОРМАЛИЗАЦИЯ)
    # ═══════════════════════════════════════════════════════════════
    op.create_table(
        "lesson_types",
        sa.Column("id", sa.Integer, primary_key=True),
        sa.Column("code", sa.String(50), nullable=False, unique=True),
        sa.Column("name", sa.String(100), nullable=False),
        sa.Column("short_name", sa.String(20), nullable=True),
        sa.Column("color", sa.String(7), nullable=True),  # HEX color for UI
    )
    
    op.execute("""
        INSERT INTO lesson_types (code, name, short_name, color) VALUES
            ('lecture', 'Лекция', 'Лек', '#3B82F6'),
            ('practice', 'Практика', 'Пр', '#10B981'),
            ('lab', 'Лабораторная', 'Лаб', '#F59E0B'),
            ('seminar', 'Семинар', 'Сем', '#8B5CF6'),
            ('exam', 'Экзамен', 'Экз', '#EF4444'),
            ('consultation', 'Консультация', 'Конс', '#6B7280')
    """)
    
    # Добавляем FK на lesson_types
    op.add_column("schedule_entries", sa.Column("lesson_type_id", sa.Integer, sa.ForeignKey("lesson_types.id"), nullable=True))
    
    # ═══════════════════════════════════════════════════════════════
    # ТАБЛИЦА ТИПОВ ОБОРУДОВАНИЯ (РАСШИРЯЕМОСТЬ)
    # ═══════════════════════════════════════════════════════════════
    op.create_table(
        "equipment_types",
        sa.Column("id", sa.Integer, primary_key=True),
        sa.Column("code", sa.String(50), nullable=False, unique=True),
        sa.Column("name", sa.String(100), nullable=False),
        sa.Column("icon", sa.String(50), nullable=True),
    )
    
    op.execute("""
        INSERT INTO equipment_types (code, name, icon) VALUES
            ('projector', 'Проектор', 'projector'),
            ('computers', 'Компьютеры', 'desktop'),
            ('whiteboard', 'Доска', 'square'),
            ('smartboard', 'Интерактивная доска', 'presentation'),
            ('air_conditioning', 'Кондиционер', 'thermometer'),
            ('video_conferencing', 'Видеоконференцсвязь', 'video')
    """)
    
    # Связь many-to-many между аудиториями и оборудованием
    op.create_table(
        "room_equipment",
        sa.Column("room_id", sa.Integer, sa.ForeignKey("rooms.id"), primary_key=True),
        sa.Column("equipment_type_id", sa.Integer, sa.ForeignKey("equipment_types.id"), primary_key=True),
        sa.Column("quantity", sa.Integer, default=1),
        sa.Column("notes", sa.String(255), nullable=True),
    )
    
    # Удаляем старые булевы поля оборудования из rooms (после миграции)
    # Примечание: это破坏性变更, раскомментируйте после миграции данных
    # op.drop_column("rooms", "has_projector")
    # op.drop_column("rooms", "has_computers")
    # op.drop_column("rooms", "has_whiteboard")
    # op.drop_column("rooms", "has_smartboard")


def downgrade():
    # Удаляем в обратном порядке
    op.drop_table("room_equipment")
    op.drop_table("equipment_types")
    op.drop_table("lesson_types")
    op.drop_index("ix_schedule_availability_query", table_name="schedule_entries")
    op.drop_index("ix_schedule_week_type", table_name="schedule_entries")
    op.drop_index("ix_schedule_room_day_time", table_name="schedule_entries")
    op.drop_column("schedule_entries", "lesson_type_id")
    op.drop_column("schedule_entries", "is_recurring")
    op.drop_column("schedule_entries", "date")
    op.drop_column("schedule_entries", "time_slot_id")
    op.drop_index("ix_rooms_building_capacity", table_name="rooms")
    op.drop_index("ix_rooms_building_id", table_name="rooms")
    op.add_column("rooms", sa.Column("building", sa.String(20), nullable=False))
    op.drop_column("rooms", "building_id")
    op.drop_table("time_slots")
    op.drop_table("buildings")
