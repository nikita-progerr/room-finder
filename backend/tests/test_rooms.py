"""
Тесты для сервиса поиска свободных аудиторий.
"""

import pytest
from datetime import time
from unittest.mock import AsyncMock, MagicMock, patch

# ── Тесты алгоритма пересечения интервалов ────────────────────────

def intervals_overlap(s_start: time, s_end: time, q_start: time, q_end: time) -> bool:
    """
    Две пары пересекаются, если:
        s_start < q_end  AND  s_end > q_start
    """
    return s_start < q_end and s_end > q_start


class TestIntervalOverlap:
    def test_exact_overlap(self):
        # Запрос: 09:00-11:00, Занятие: 09:00-11:00 — пересечение
        assert intervals_overlap(time(9, 0), time(11, 0), time(9, 0), time(11, 0))

    def test_partial_overlap_left(self):
        # Запрос: 09:00-11:00, Занятие: 08:00-10:00 — пересечение
        assert intervals_overlap(time(8, 0), time(10, 0), time(9, 0), time(11, 0))

    def test_partial_overlap_right(self):
        # Запрос: 09:00-11:00, Занятие: 10:00-12:00 — пересечение
        assert intervals_overlap(time(10, 0), time(12, 0), time(9, 0), time(11, 0))

    def test_contained_inside(self):
        # Запрос: 09:00-11:00, Занятие: 09:30-10:30 — пересечение
        assert intervals_overlap(time(9, 30), time(10, 30), time(9, 0), time(11, 0))

    def test_no_overlap_before(self):
        # Запрос: 09:00-11:00, Занятие: 07:00-09:00 — не пересекаются (смежные)
        assert not intervals_overlap(time(7, 0), time(9, 0), time(9, 0), time(11, 0))

    def test_no_overlap_after(self):
        # Запрос: 09:00-11:00, Занятие: 11:00-13:00 — не пересекаются (смежные)
        assert not intervals_overlap(time(11, 0), time(13, 0), time(9, 0), time(11, 0))

    def test_no_overlap_far_before(self):
        # Запрос: 14:00-16:00, Занятие: 08:00-10:00
        assert not intervals_overlap(time(8, 0), time(10, 0), time(14, 0), time(16, 0))


# ── Тесты парсера ─────────────────────────────────────────────────

class TestParser:
    def test_normalize_time_colon(self):
        from app.services.parser import ScheduleParser
        p = ScheduleParser()
        assert p._normalize_time("09:45") == "09:45"

    def test_normalize_time_dot(self):
        from app.services.parser import ScheduleParser
        p = ScheduleParser()
        assert p._normalize_time("9.45") == "09:45"

    def test_extract_time_direct(self):
        from app.services.parser import ScheduleParser
        p = ScheduleParser()
        t_start, t_end = p._extract_time("08:00 - 09:35")
        assert t_start == "08:00"
        assert t_end == "09:35"

    def test_extract_time_pair_number(self):
        from app.services.parser import ScheduleParser
        p = ScheduleParser()
        t_start, t_end = p._extract_time("1 пара")
        assert t_start == "08:00"
        assert t_end == "09:35"

    def test_find_day(self):
        from app.services.parser import ScheduleParser
        p = ScheduleParser()
        assert p._find_day("Понедельник") == 0
        assert p._find_day("Пятница") == 4
        assert p._find_day("суббота") == 5
        assert p._find_day("нет дня") is None

    def test_page_hash_changed(self):
        from app.services.parser import ScheduleParser
        p = ScheduleParser()
        assert p.is_changed("content v1") is True    # первый раз — изменилась
        assert p.is_changed("content v1") is False   # повтор — не изменилась
        assert p.is_changed("content v2") is True    # новый контент


# ── Тесты week_type ───────────────────────────────────────────────

class TestWeekType:
    def test_odd_week(self):
        from app.services.room_service import _get_week_type
        assert _get_week_type(1) == "odd"
        assert _get_week_type(3) == "odd"

    def test_even_week(self):
        from app.services.room_service import _get_week_type
        assert _get_week_type(2) == "even"
        assert _get_week_type(10) == "even"
