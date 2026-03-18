"""initial schema

Revision ID: 001_initial
Create Date: 2024-01-01 00:00:00
"""
from alembic import op
import sqlalchemy as sa

revision = "001_initial"
down_revision = None
branch_labels = None
depends_on = None


def upgrade():
    # Таблица аудиторий
    op.create_table(
        "rooms",
        sa.Column("id", sa.Integer, primary_key=True),
        sa.Column("name", sa.String(50), nullable=False, unique=True),
        sa.Column("building", sa.String(20), nullable=False),
        sa.Column("floor", sa.Integer, default=1),
        sa.Column("capacity", sa.Integer, default=30),
        sa.Column("has_projector", sa.Boolean, default=False),
        sa.Column("has_computers", sa.Boolean, default=False),
        sa.Column("has_whiteboard", sa.Boolean, default=True),
        sa.Column("has_smartboard", sa.Boolean, default=False),
        sa.Column("room_type", sa.String(30), default="classroom"),
        sa.Column("description", sa.Text, nullable=True),
        sa.Column("extra_info", sa.JSON, nullable=True),
    )
    op.create_index("ix_rooms_name", "rooms", ["name"])
    op.create_index("ix_rooms_building", "rooms", ["building"])

    # Таблица расписания
    op.create_table(
        "schedule_entries",
        sa.Column("id", sa.Integer, primary_key=True),
        sa.Column("room_id", sa.Integer, sa.ForeignKey("rooms.id"), nullable=False),
        sa.Column("day_of_week", sa.Integer, nullable=False),
        sa.Column("week_type", sa.String(10), default="both"),
        sa.Column("time_start", sa.Time, nullable=False),
        sa.Column("time_end", sa.Time, nullable=False),
        sa.Column("subject", sa.String(200), nullable=False),
        sa.Column("teacher", sa.String(150), nullable=True),
        sa.Column("group_name", sa.String(100), nullable=True),
        sa.Column("lesson_type", sa.String(50), nullable=True),
        sa.Column("source_hash", sa.String(64), nullable=True),
        sa.Column("created_at", sa.DateTime, server_default=sa.func.now()),
        sa.Column("updated_at", sa.DateTime, server_default=sa.func.now(), onupdate=sa.func.now()),
    )
    op.create_index("ix_schedule_room_id", "schedule_entries", ["room_id"])
    op.create_index("ix_schedule_day", "schedule_entries", ["day_of_week"])

    # Лог парсинга
    op.create_table(
        "parse_logs",
        sa.Column("id", sa.Integer, primary_key=True),
        sa.Column("started_at", sa.DateTime, nullable=False),
        sa.Column("finished_at", sa.DateTime, nullable=True),
        sa.Column("status", sa.String(20), nullable=False),
        sa.Column("entries_parsed", sa.Integer, default=0),
        sa.Column("entries_created", sa.Integer, default=0),
        sa.Column("entries_updated", sa.Integer, default=0),
        sa.Column("error_message", sa.Text, nullable=True),
    )

    # Seed data — демо-аудитории
    op.execute("""
        INSERT INTO rooms (name, building, floor, capacity, has_projector, has_computers, room_type)
        VALUES
            ('101', 'Главный', 1, 30, true, false, 'classroom'),
            ('102', 'Главный', 1, 25, false, false, 'classroom'),
            ('103', 'Главный', 1, 40, true, false, 'lecture_hall'),
            ('201', 'Главный', 2, 30, true, false, 'classroom'),
            ('202', 'Главный', 2, 20, false, true, 'lab'),
            ('203', 'Главный', 2, 15, true, true, 'lab'),
            ('301', 'Главный', 3, 50, true, false, 'lecture_hall'),
            ('302', 'Главный', 3, 30, false, false, 'classroom'),
            ('А101', 'А', 1, 25, true, false, 'classroom'),
            ('А102', 'А', 1, 30, false, true, 'lab'),
            ('А201', 'А', 2, 40, true, false, 'lecture_hall')
    """)


def downgrade():
    op.drop_table("parse_logs")
    op.drop_table("schedule_entries")
    op.drop_table("rooms")
