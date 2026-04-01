"""seed_rooms_data

Revision ID: 003_seed_rooms_data
Create Date: 2026-03-19 00:00:00

Данные аудиторий:
- Корпус 1: 108, 301, 302, 303, 306, 308, 310, 312, 401, 403, 404, 406, 407, 408, 410, 411, актовый зал
- Корпус 2: 106, 113, 117, 129, 132, 211, 220, 222, 225, 229, 231, 310, 311, 312, 313, 320, 322, 325, 326, 329, 331, 408, 408а, 409, 411, 412, 418, 419
- Корпус 3: 107, 114, 120, 124, 201, 205, 206, 210, 212, 213, 214, 217, 218, 220
- Корпус 4: тр. зал, 210, 211, 212, 213, 215, 217, 218, 219, 221, читальный зал, читальный зал 2
- Корпус 5: 804, 803, 802, 801, 800, 704, 701
"""

from alembic import op
import sqlalchemy as sa

revision = "003_seed_rooms_data"
down_revision = "002_redesigned_schema"
branch_labels = None
depends_on = None


def upgrade():
    # Очищаем старые данные корпусов и аудиторий
    op.execute("DELETE FROM rooms")
    op.execute("DELETE FROM buildings")
    
    # Вставляем корпуса
    op.execute("""
        INSERT INTO buildings (code, name, is_active) VALUES
            ('1', 'Корпус 1', true),
            ('2', 'Корпус 2', true),
            ('3', 'Корпус 3', true),
            ('4', 'Корпус 4', true),
            ('5', 'Корпус 5', true)
    """)
    
    # Вставляем аудитории корпуса 1
    op.execute("""
        INSERT INTO rooms (name, building_id, floor, capacity, room_type, has_projector, has_computers, has_whiteboard, has_smartboard) VALUES
            ('108', (SELECT id FROM buildings WHERE code = '1'), 1, 30, 'classroom', true, false, true, false),
            ('301', (SELECT id FROM buildings WHERE code = '1'), 3, 25, 'classroom', false, false, true, false),
            ('302', (SELECT id FROM buildings WHERE code = '1'), 3, 25, 'classroom', false, false, true, false),
            ('303', (SELECT id FROM buildings WHERE code = '1'), 3, 25, 'classroom', false, false, true, false),
            ('306', (SELECT id FROM buildings WHERE code = '1'), 3, 30, 'classroom', true, false, true, false),
            ('308', (SELECT id FROM buildings WHERE code = '1'), 3, 30, 'classroom', true, false, true, false),
            ('310', (SELECT id FROM buildings WHERE code = '1'), 3, 30, 'classroom', true, false, true, false),
            ('312', (SELECT id FROM buildings WHERE code = '1'), 3, 30, 'classroom', true, false, true, false),
            ('401', (SELECT id FROM buildings WHERE code = '1'), 4, 35, 'classroom', true, false, true, false),
            ('403', (SELECT id FROM buildings WHERE code = '1'), 4, 25, 'classroom', false, false, true, false),
            ('404', (SELECT id FROM buildings WHERE code = '1'), 4, 25, 'classroom', false, false, true, false),
            ('406', (SELECT id FROM buildings WHERE code = '1'), 4, 30, 'classroom', true, false, true, false),
            ('407', (SELECT id FROM buildings WHERE code = '1'), 4, 30, 'classroom', true, false, true, false),
            ('408', (SELECT id FROM buildings WHERE code = '1'), 4, 30, 'classroom', true, false, true, false),
            ('410', (SELECT id FROM buildings WHERE code = '1'), 4, 30, 'classroom', true, false, true, false),
            ('411', (SELECT id FROM buildings WHERE code = '1'), 4, 30, 'classroom', true, false, true, false),
            ('актовый зал', (SELECT id FROM buildings WHERE code = '1'), 1, 200, 'lecture_hall', true, false, true, true)
    """)
    
    # Вставляем аудитории корпуса 2
    op.execute("""
        INSERT INTO rooms (name, building_id, floor, capacity, room_type, has_projector, has_computers, has_whiteboard, has_smartboard) VALUES
            ('106', (SELECT id FROM buildings WHERE code = '2'), 1, 30, 'classroom', true, false, true, false),
            ('113', (SELECT id FROM buildings WHERE code = '2'), 1, 25, 'classroom', false, false, true, false),
            ('117', (SELECT id FROM buildings WHERE code = '2'), 1, 20, 'classroom', false, false, true, false),
            ('129', (SELECT id FROM buildings WHERE code = '2'), 1, 25, 'classroom', false, false, true, false),
            ('132', (SELECT id FROM buildings WHERE code = '2'), 1, 30, 'classroom', true, false, true, false),
            ('211', (SELECT id FROM buildings WHERE code = '2'), 2, 30, 'classroom', true, false, true, false),
            ('220', (SELECT id FROM buildings WHERE code = '2'), 2, 25, 'classroom', false, false, true, false),
            ('222', (SELECT id FROM buildings WHERE code = '2'), 2, 30, 'classroom', true, false, true, false),
            ('225', (SELECT id FROM buildings WHERE code = '2'), 2, 25, 'classroom', false, false, true, false),
            ('229', (SELECT id FROM buildings WHERE code = '2'), 2, 30, 'classroom', true, false, true, false),
            ('231', (SELECT id FROM buildings WHERE code = '2'), 2, 25, 'classroom', false, false, true, false),
            ('310', (SELECT id FROM buildings WHERE code = '2'), 3, 30, 'classroom', true, false, true, false),
            ('311', (SELECT id FROM buildings WHERE code = '2'), 3, 25, 'classroom', false, false, true, false),
            ('312', (SELECT id FROM buildings WHERE code = '2'), 3, 30, 'classroom', true, false, true, false),
            ('313', (SELECT id FROM buildings WHERE code = '2'), 3, 25, 'classroom', false, false, true, false),
            ('320', (SELECT id FROM buildings WHERE code = '2'), 3, 30, 'classroom', true, false, true, false),
            ('322', (SELECT id FROM buildings WHERE code = '2'), 3, 25, 'classroom', false, false, true, false),
            ('325', (SELECT id FROM buildings WHERE code = '2'), 3, 30, 'classroom', true, false, true, false),
            ('326', (SELECT id FROM buildings WHERE code = '2'), 3, 25, 'classroom', false, false, true, false),
            ('329', (SELECT id FROM buildings WHERE code = '2'), 3, 30, 'classroom', true, false, true, false),
            ('331', (SELECT id FROM buildings WHERE code = '2'), 3, 25, 'classroom', false, false, true, false),
            ('408', (SELECT id FROM buildings WHERE code = '2'), 4, 30, 'classroom', true, false, true, false),
            ('408а', (SELECT id FROM buildings WHERE code = '2'), 4, 20, 'classroom', false, false, true, false),
            ('409', (SELECT id FROM buildings WHERE code = '2'), 4, 30, 'classroom', true, false, true, false),
            ('411', (SELECT id FROM buildings WHERE code = '2'), 4, 25, 'classroom', false, false, true, false),
            ('412', (SELECT id FROM buildings WHERE code = '2'), 4, 30, 'classroom', true, false, true, false),
            ('418', (SELECT id FROM buildings WHERE code = '2'), 4, 25, 'classroom', false, false, true, false),
            ('419', (SELECT id FROM buildings WHERE code = '2'), 4, 30, 'classroom', true, false, true, false)
    """)
    
    # Вставляем аудитории корпуса 3
    op.execute("""
        INSERT INTO rooms (name, building_id, floor, capacity, room_type, has_projector, has_computers, has_whiteboard, has_smartboard) VALUES
            ('107', (SELECT id FROM buildings WHERE code = '3'), 1, 30, 'classroom', true, false, true, false),
            ('114', (SELECT id FROM buildings WHERE code = '3'), 1, 25, 'classroom', false, false, true, false),
            ('120', (SELECT id FROM buildings WHERE code = '3'), 1, 20, 'classroom', false, false, true, false),
            ('124', (SELECT id FROM buildings WHERE code = '3'), 1, 25, 'classroom', false, false, true, false),
            ('201', (SELECT id FROM buildings WHERE code = '3'), 2, 30, 'classroom', true, false, true, false),
            ('205', (SELECT id FROM buildings WHERE code = '3'), 2, 25, 'classroom', false, false, true, false),
            ('206', (SELECT id FROM buildings WHERE code = '3'), 2, 30, 'classroom', true, false, true, false),
            ('210', (SELECT id FROM buildings WHERE code = '3'), 2, 25, 'classroom', false, false, true, false),
            ('212', (SELECT id FROM buildings WHERE code = '3'), 2, 30, 'classroom', true, false, true, false),
            ('213', (SELECT id FROM buildings WHERE code = '3'), 2, 25, 'classroom', false, false, true, false),
            ('214', (SELECT id FROM buildings WHERE code = '3'), 2, 30, 'classroom', true, false, true, false),
            ('217', (SELECT id FROM buildings WHERE code = '3'), 2, 25, 'classroom', false, false, true, false),
            ('218', (SELECT id FROM buildings WHERE code = '3'), 2, 30, 'classroom', true, false, true, false),
            ('220', (SELECT id FROM buildings WHERE code = '3'), 2, 40, 'lecture_hall', true, false, true, false)
    """)
    
    # Вставляем аудитории корпуса 4
    op.execute("""
        INSERT INTO rooms (name, building_id, floor, capacity, room_type, has_projector, has_computers, has_whiteboard, has_smartboard) VALUES
            ('тр. зал', (SELECT id FROM buildings WHERE code = '4'), 1, 100, 'lecture_hall', true, false, true, true),
            ('210', (SELECT id FROM buildings WHERE code = '4'), 2, 25, 'classroom', false, false, true, false),
            ('211', (SELECT id FROM buildings WHERE code = '4'), 2, 30, 'classroom', true, false, true, false),
            ('212', (SELECT id FROM buildings WHERE code = '4'), 2, 25, 'classroom', false, false, true, false),
            ('213', (SELECT id FROM buildings WHERE code = '4'), 2, 30, 'classroom', true, false, true, false),
            ('215', (SELECT id FROM buildings WHERE code = '4'), 2, 25, 'classroom', false, false, true, false),
            ('217', (SELECT id FROM buildings WHERE code = '4'), 2, 30, 'classroom', true, false, true, false),
            ('218', (SELECT id FROM buildings WHERE code = '4'), 2, 25, 'classroom', false, false, true, false),
            ('219', (SELECT id FROM buildings WHERE code = '4'), 2, 30, 'classroom', true, false, true, false),
            ('221', (SELECT id FROM buildings WHERE code = '4'), 2, 25, 'classroom', false, false, true, false),
            ('читальный зал', (SELECT id FROM buildings WHERE code = '4'), 1, 50, 'classroom', false, true, true, false),
            ('читальный зал 2', (SELECT id FROM buildings WHERE code = '4'), 2, 30, 'classroom', false, true, true, false)
    """)
    
    # Вставляем аудитории корпуса 5
    op.execute("""
        INSERT INTO rooms (name, building_id, floor, capacity, room_type, has_projector, has_computers, has_whiteboard, has_smartboard) VALUES
            ('804', (SELECT id FROM buildings WHERE code = '5'), 8, 30, 'classroom', true, false, true, false),
            ('803', (SELECT id FROM buildings WHERE code = '5'), 8, 25, 'classroom', false, false, true, false),
            ('802', (SELECT id FROM buildings WHERE code = '5'), 8, 30, 'classroom', true, false, true, false),
            ('801', (SELECT id FROM buildings WHERE code = '5'), 8, 25, 'classroom', false, false, true, false),
            ('800', (SELECT id FROM buildings WHERE code = '5'), 8, 40, 'lecture_hall', true, false, true, false),
            ('704', (SELECT id FROM buildings WHERE code = '5'), 7, 30, 'classroom', true, false, true, false),
            ('701', (SELECT id FROM buildings WHERE code = '5'), 7, 25, 'classroom', false, false, true, false)
    """)


def downgrade():
    op.execute("DELETE FROM rooms")
    op.execute("DELETE FROM buildings")
