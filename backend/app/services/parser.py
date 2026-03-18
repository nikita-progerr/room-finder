"""
Парсер расписания с сайта sarfti.ru

Стратегия парсинга:
───────────────────
1. PRIMARY: Поиск таблиц <table> с заголовками дней недели
2. FALLBACK: Поиск блоков расписания по CSS-классам
3. GRACEFUL DEGRADATION: При ошибке — логирование без краша

Устойчивость:
- Retry с exponential backoff
- Проверка хэша страницы (не парсим если не изменилась)
- Подробное логирование каждого шага
"""

import hashlib
import logging
import re
from datetime import datetime, time
from typing import Optional

import requests
from bs4 import BeautifulSoup, Tag

from app.core.config import settings

logger = logging.getLogger(__name__)


# Маппинг дней недели RU → int
DAYS_MAP = {
    "понедельник": 0, "пн": 0,
    "вторник": 1,     "вт": 1,
    "среда": 2,       "ср": 2,
    "четверг": 3,     "чт": 3,
    "пятница": 4,     "пт": 4,
    "суббота": 5,     "сб": 5,
    "воскресенье": 6, "вс": 6,
}

# Стандартные пары (пара_номер → (time_start, time_end))
STANDARD_PAIRS = {
    1: ("08:00", "09:35"),
    2: ("09:45", "11:20"),
    3: ("11:30", "13:05"),
    4: ("13:35", "15:10"),
    5: ("15:20", "16:55"),
    6: ("17:05", "18:40"),
    7: ("18:50", "20:25"),
}


class ParsedLesson:
    """Одно занятие из расписания"""
    def __init__(
        self,
        room_name: str,
        day_of_week: int,
        time_start: str,
        time_end: str,
        subject: str,
        teacher: Optional[str] = None,
        group_name: Optional[str] = None,
        lesson_type: Optional[str] = None,
        week_type: str = "both",
    ):
        self.room_name = room_name.strip().upper()
        self.day_of_week = day_of_week
        self.time_start = time_start
        self.time_end = time_end
        self.subject = subject.strip()
        self.teacher = teacher.strip() if teacher else None
        self.group_name = group_name.strip() if group_name else None
        self.lesson_type = lesson_type
        self.week_type = week_type

    def to_dict(self) -> dict:
        return self.__dict__


class ScheduleParser:
    def __init__(self):
        self.session = requests.Session()
        self.session.headers.update({
            "User-Agent": "Mozilla/5.0 (SmartRoomFinder/1.0; +https://github.com/your-org)"
        })
        self._last_hash: Optional[str] = None

    def fetch_page(self, url: str) -> Optional[str]:
        """Загружает страницу с retry-логикой"""
        for attempt in range(settings.PARSER_MAX_RETRIES):
            try:
                logger.info(f"Fetching schedule (attempt {attempt + 1}): {url}")
                resp = self.session.get(url, timeout=settings.PARSER_REQUEST_TIMEOUT)
                resp.raise_for_status()
                resp.encoding = resp.apparent_encoding
                return resp.text
            except requests.RequestException as e:
                logger.warning(f"Fetch failed (attempt {attempt + 1}): {e}")
                if attempt == settings.PARSER_MAX_RETRIES - 1:
                    logger.error(f"All retries exhausted for {url}")
                    raise
        return None

    def is_changed(self, html: str) -> bool:
        """Проверяет, изменилась ли страница с последнего парсинга"""
        current_hash = hashlib.md5(html.encode()).hexdigest()
        if current_hash == self._last_hash:
            logger.info("Schedule page unchanged, skipping parse")
            return False
        self._last_hash = current_hash
        return True

    def parse(self, html: str) -> list[ParsedLesson]:
        """Основная точка входа — выбирает стратегию парсинга"""
        soup = BeautifulSoup(html, "lxml")
        lessons = []

        # Стратегия 1: таблицы расписания
        lessons = self._parse_tables(soup)

        if not lessons:
            # Стратегия 2: div-блоки
            lessons = self._parse_divs(soup)

        if not lessons:
            logger.warning("No lessons found with any parsing strategy!")

        logger.info(f"Parsed {len(lessons)} lessons total")
        return lessons

    def _parse_tables(self, soup: BeautifulSoup) -> list[ParsedLesson]:
        """Парсит расписание из HTML-таблиц"""
        lessons = []
        tables = soup.find_all("table")

        for table in tables:
            try:
                parsed = self._parse_single_table(table)
                lessons.extend(parsed)
            except Exception as e:
                logger.warning(f"Failed to parse table: {e}")

        return lessons

    def _parse_single_table(self, table: Tag) -> list[ParsedLesson]:
        """Пытается распарсить одну таблицу как расписание"""
        lessons = []
        rows = table.find_all("tr")
        if len(rows) < 2:
            return []

        # Ищем заголовок с днями недели
        header = rows[0]
        headers_text = [th.get_text(strip=True).lower() for th in header.find_all(["th", "td"])]

        # Определяем колонки дней
        day_columns: dict[int, int] = {}  # col_index → day_of_week
        for i, h in enumerate(headers_text):
            for day_key, day_val in DAYS_MAP.items():
                if day_key in h:
                    day_columns[i] = day_val
                    break

        if not day_columns:
            return []  # Не таблица расписания

        for row in rows[1:]:
            cells = row.find_all(["td", "th"])
            if not cells:
                continue

            # Первая колонка обычно — номер пары или время
            time_cell = cells[0].get_text(strip=True)
            t_start, t_end = self._extract_time(time_cell)
            if not t_start:
                continue

            for col_idx, day_val in day_columns.items():
                if col_idx >= len(cells):
                    continue
                cell = cells[col_idx]
                cell_text = cell.get_text(separator=" ", strip=True)
                if not cell_text or cell_text in ["-", "—", ""]:
                    continue

                parsed = self._extract_lesson_from_cell(cell_text, day_val, t_start, t_end)
                if parsed:
                    lessons.extend(parsed)

        return lessons

    def _parse_divs(self, soup: BeautifulSoup) -> list[ParsedLesson]:
        """Fallback: парсит расписание из div-блоков"""
        lessons = []
        # Ищем блоки с типичными классами расписания
        schedule_blocks = soup.find_all(["div", "section"],
                                        class_=re.compile(r"schedule|rasp|timetable", re.I))
        for block in schedule_blocks:
            text = block.get_text(separator="\n")
            parsed = self._parse_text_schedule(text)
            lessons.extend(parsed)
        return lessons

    def _parse_text_schedule(self, text: str) -> list[ParsedLesson]:
        """Парсит неструктурированный текст расписания"""
        lessons = []
        lines = [l.strip() for l in text.split("\n") if l.strip()]

        current_day = None
        current_room = None

        for line in lines:
            # Ищем день недели
            day = self._find_day(line)
            if day is not None:
                current_day = day
                continue

            # Ищем аудиторию
            room_match = re.search(r"\b(\d{3,4}[а-яА-Я]?)\b", line)
            if room_match:
                current_room = room_match.group(1)

            # Ищем время
            time_match = re.search(r"(\d{1,2}[:.]\d{2})\s*[-–—]\s*(\d{1,2}[:.]\d{2})", line)
            if time_match and current_day is not None and current_room:
                t_start = self._normalize_time(time_match.group(1))
                t_end = self._normalize_time(time_match.group(2))
                subject = re.sub(r"\d{1,2}[:.]\d{2}.*\d{1,2}[:.]\d{2}", "", line).strip()

                if t_start and t_end and subject:
                    lessons.append(ParsedLesson(
                        room_name=current_room,
                        day_of_week=current_day,
                        time_start=t_start,
                        time_end=t_end,
                        subject=subject or "Занятие",
                    ))

        return lessons

    def _extract_time(self, cell_text: str) -> tuple[Optional[str], Optional[str]]:
        """Извлекает время из ячейки (поддерживает формат '1 пара', '08:00-09:35')"""
        # Прямой формат времени
        m = re.search(r"(\d{1,2}[:.]\d{2})\s*[-–—]\s*(\d{1,2}[:.]\d{2})", cell_text)
        if m:
            return self._normalize_time(m.group(1)), self._normalize_time(m.group(2))

        # Номер пары
        pair_match = re.search(r"(\d+)\s*(?:пара|п\.)?", cell_text, re.I)
        if pair_match:
            pair_num = int(pair_match.group(1))
            if pair_num in STANDARD_PAIRS:
                return STANDARD_PAIRS[pair_num]

        return None, None

    def _normalize_time(self, t: str) -> Optional[str]:
        """Нормализует строку времени к формату HH:MM"""
        t = t.replace(".", ":")
        parts = t.split(":")
        if len(parts) == 2:
            try:
                h, m = int(parts[0]), int(parts[1])
                return f"{h:02d}:{m:02d}"
            except ValueError:
                pass
        return None

    def _find_day(self, text: str) -> Optional[int]:
        text_lower = text.lower()
        for key, val in DAYS_MAP.items():
            if key in text_lower:
                return val
        return None

    def _extract_lesson_from_cell(
        self,
        cell_text: str,
        day: int,
        t_start: str,
        t_end: str,
    ) -> list[ParsedLesson]:
        """Извлекает одно или несколько занятий из ячейки таблицы"""
        lessons = []

        # Ищем аудиторию
        room_match = re.search(r"\b([А-Яа-я]?\d{3,4}[А-Яа-я]?)\b", cell_text)
        room_name = room_match.group(1) if room_match else "UNKNOWN"

        # Чётность недели
        week_type = "both"
        if re.search(r"числ|нечёт|нечет|1\s*нед", cell_text, re.I):
            week_type = "odd"
        elif re.search(r"знам|чёт|чет|2\s*нед", cell_text, re.I):
            week_type = "even"

        # Тип занятия
        lesson_type = None
        if re.search(r"лекц|лек\.", cell_text, re.I):
            lesson_type = "lecture"
        elif re.search(r"практ|пр\.", cell_text, re.I):
            lesson_type = "practice"
        elif re.search(r"лаб\.", cell_text, re.I):
            lesson_type = "lab"

        # Очищаем текст — убираем аудиторию и техническую инфу
        subject = re.sub(r"\b[А-Яа-я]?\d{3,4}[А-Яа-я]?\b", "", cell_text)
        subject = re.sub(r"\s+", " ", subject).strip() or "Занятие"

        lessons.append(ParsedLesson(
            room_name=room_name,
            day_of_week=day,
            time_start=t_start,
            time_end=t_end,
            subject=subject,
            lesson_type=lesson_type,
            week_type=week_type,
        ))

        return lessons


def run_parser() -> list[dict]:
    """
    Основная функция парсинга.
    Возвращает список словарей с занятиями для сохранения в БД.
    """
    parser = ScheduleParser()
    try:
        html = parser.fetch_page(settings.SCHEDULE_URL)
        if not html:
            return []
        if not parser.is_changed(html):
            return []
        lessons = parser.parse(html)
        return [l.to_dict() for l in lessons]
    except Exception as e:
        logger.error(f"Parser failed: {e}", exc_info=True)
        raise
