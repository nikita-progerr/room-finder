"""
Тесты для парсера и сервиса поиска аудиторий.
Запуск: pytest tests/ -v
"""

import pytest
from datetime import time
from unittest.mock import patch, MagicMock

from app.services.parser import ScheduleParser, ParsedLesson, STANDARD_PAIRS
from app.services.room_service import _parse_time, _get_week_type


# ── Тесты парсера ──────────────────────────────────────────────────

class TestScheduleParser:
    def setup_method(self):
        self.parser = ScheduleParser()

    def test_normalize_time_colon(self):
        assert self.parser._normalize_time("09:30") == "09:30"
        assert self.parser._normalize_time("9:05") == "09:05"

    def test_normalize_time_dot(self):
        assert self.parser._normalize_time("13.45") == "13:45"

    def test_normalize_time_invalid(self):
        assert self.parser._normalize_time("invalid") is None

    def test_extract_time_direct(self):
        t_start, t_end = self.parser._extract_time("09:00 - 10:35")
        assert t_start == "09:00"
        assert t_end == "10:35"

    def test_extract_time_pair_number(self):
        t_start, t_end = self.parser._extract_time("2 пара")
        assert t_start == STANDARD_PAIRS[2][0]
        assert t_end == STANDARD_PAIRS[2][1]

    def test_find_day_full(self):
        assert self.parser._find_day("Понедельник") == 0
        assert self.parser._find_day("ПЯТНИЦА") == 4
        assert self.parser._find_day("суббота") == 5

    def test_find_day_short(self):
        assert self.parser._find_day("Пн") == 0
        assert self.parser._find_day("ср") == 2

    def test_find_day_not_found(self):
        assert self.parser._find_day("Информатика") is None

    def test_is_changed_first_call(self):
        assert self.parser.is_changed("<html>test</html>") is True

    def test_is_changed_same_content(self):
        html = "<html>same content</html>"
        self.parser.is_changed(html)
        assert self.parser.is_changed(html) is False

    def test_is_changed_different_content(self):
        self.parser.is_changed("<html>v1</html>")
        assert self.parser.is_changed("<html>v2</html>") is True

    def test_parse_simple_table(self):
        html = """
        <table>
          <tr><th>Пара</th><th>Понедельник</th><th>Вторник</th></tr>
          <tr><td>1 пара</td><td>Математика ауд.101</td><td>-</td></tr>
          <tr><td>2 пара</td><td>-</td><td>Физика ауд.202</td></tr>
        </table>
        """
        from bs4 import BeautifulSoup
        soup = BeautifulSoup(html, "lxml")
        lessons = self.parser._parse_tables(soup)
        assert len(lessons) >= 1

    def test_parsed_lesson_room_name_uppercase(self):
        lesson = ParsedLesson(
            room_name="а101",
            day_of_week=0,
            time_start="08:00",
            time_end="09:35",
            subject="Математика",
        )
        assert lesson.room_name == "А101"

    def test_week_type_extraction_odd(self):
        lessons = self.parser._extract_lesson_from_cell(
            "Математика 101 числитель", 0, "08:00", "09:35"
        )
        assert lessons[0].week_type == "odd"

    def test_week_type_extraction_even(self):
        lessons = self.parser._extract_lesson_from_cell(
            "Физика 202 знаменатель", 1, "09:45", "11:20"
        )
        assert lessons[0].week_type == "even"

    def test_week_type_both_by_default(self):
        lessons = self.parser._extract_lesson_from_cell(
            "Химия 305", 2, "11:30", "13:05"
        )
        assert lessons[0].week_type == "both"


# ── Тесты вспомогательных функций сервиса ─────────────────────────

class TestRoomService:
    def test_parse_time_valid(self):
        t = _parse_time("09:30")
        assert t == time(9, 30)

    def test_parse_time_zero_pad(self):
        t = _parse_time("08:00")
        assert t == time(8, 0)

    def test_get_week_type_odd(self):
        assert _get_week_type(1) == "odd"
        assert _get_week_type(3) == "odd"
        assert _get_week_type(15) == "odd"

    def test_get_week_type_even(self):
        assert _get_week_type(2) == "even"
        assert _get_week_type(4) == "even"
        assert _get_week_type(16) == "even"

    def test_get_week_type_current(self):
        result = _get_week_type(None)
        assert result in ("odd", "even")


# ── Тест API (интеграционный) ──────────────────────────────────────

@pytest.mark.asyncio
async def test_health_endpoint():
    """Проверка health-check эндпоинта"""
    from httpx import AsyncClient, ASGITransport
    from app.main import app

    async with AsyncClient(
        transport=ASGITransport(app=app), base_url="http://test"
    ) as client:
        response = await client.get("/health")
        assert response.status_code == 200
        assert response.json()["status"] == "healthy"
