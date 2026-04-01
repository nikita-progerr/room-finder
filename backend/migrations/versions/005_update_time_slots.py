"""update_time_slots

Revision ID: 005_update_time_slots
Create Date: 2026-03-19 00:00:00

Обновлённое расписание пар:
1 пара: 08:30 - 10:05
2 пара: 10:15 - 11:50
3 пара: 12:00 - 13:35
4 пара: 14:15 - 15:50
5 пара: 16:00 - 17:35
6 пара: 18:00 - 19:35
7 пара: 19:45 - 21:20
"""

from alembic import op
import sqlalchemy as sa

revision = "005_update_time_slots"
down_revision = "004_seed_teachers_data"
branch_labels = None
depends_on = None


def upgrade():
    # Очищаем старые слоты
    op.execute("DELETE FROM time_slots")
    
    # Вставляем новые слоты
    op.execute("""
        INSERT INTO time_slots (slot_number, time_start, time_end, label, duration_type, is_active) VALUES
            (1, '08:30', '10:05', '1 пара', 'standard', true),
            (2, '10:15', '11:50', '2 пара', 'standard', true),
            (3, '12:00', '13:35', '3 пара', 'standard', true),
            (4, '14:15', '15:50', '4 пара', 'standard', true),
            (5, '16:00', '17:35', '5 пара', 'standard', true),
            (6, '18:00', '19:35', '6 пара', 'standard', true),
            (7, '19:45', '21:20', '7 пара', 'standard', true)
    """)


def downgrade():
    op.execute("DELETE FROM time_slots")
    op.execute("""
        INSERT INTO time_slots (slot_number, time_start, time_end, label, duration_type, is_active) VALUES
            (1, '08:00', '09:30', '1 пара', 'standard', true),
            (2, '09:45', '11:15', '2 пара', 'standard', true),
            (3, '11:30', '13:00', '3 пара', 'standard', true),
            (4, '13:30', '15:00', '4 пара', 'standard', true),
            (5, '15:15', '16:45', '5 пара', 'standard', true),
            (6, '17:00', '18:30', '6 пара', 'standard', true),
            (7, '18:45', '20:15', '7 пара', 'standard', true),
            (8, '20:30', '22:00', '8 пара', 'standard', true)
    """)
