# Структура базы данных — Умный поиск свободных аудиторий

## Обзор диаграммы связей

```
┌──────────────┐       ┌──────────────┐       ┌──────────────────┐
│  buildings   │       │    rooms     │       │ schedule_entries  │
├──────────────┤       ├──────────────┤       ├──────────────────┤
│ id (PK)      │──┐    │ id (PK)      │──┐    │ id (PK)          │
│ code         │  │    │ name         │  │    │ room_id (FK)     │──┐
│ name         │  └───►│ building_id  │◄─┘    │ day_of_week      │  │
│ address      │       │ floor        │       │ time_start       │  │
│ coordinates  │       │ capacity     │       │ time_end         │  │
└──────────────┘       │ equipment... │       │ week_type        │◄─┘
                       └──────────────┘       │ subject          │
                              │               │ teacher          │
                              ▼               │ group_name       │
                       ┌──────────────┐       └──────────────────┘
                       │room_equipment│              │
                       ├──────────────┤              ▼
                       │ room_id (FK) │────► ┌──────────────┐
                       │ equip_type_id│      │ lesson_types │
                       │ quantity    │      ├──────────────┤
                       └──────────────┘      │ id (PK)      │
                              │              │ code         │
                              ▼              │ name         │
                       ┌──────────────┐      │ color        │
                       │equipment_types      └──────────────┘
                       ├──────────────┐
                       │ id (PK)     │
                       │ code        │
                       │ name        │
                       └──────────────┘
                               
                       ┌──────────────┐
                       │ time_slots   │
                       ├──────────────┤
                       │ id (PK)      │
                       │ slot_number  │
                       │ time_start   │
                       │ time_end     │
                       │ label        │
                       └──────────────┘
```

---

## Таблица 1: `buildings` (Корпуса)

| Поле | Тип | Описание |
|------|-----|----------|
| id | SERIAL | Первичный ключ |
| code | VARCHAR(20) | Уникальный код (main, a, b) |
| name | VARCHAR(100) | Полное название |
| address | VARCHAR(255) | Адрес корпуса |
| latitude | FLOAT | Географическая широта |
| longitude | FLOAT | Географическая долгота |
| is_active | BOOLEAN | Активен ли корпус |
| created_at | TIMESTAMP | Дата создания |
| updated_at | TIMESTAMP | Дата обновления |

**Индексы:**
- `ix_buildings_code` (UNIQUE) — быстрый поиск по коду
- `ix_buildings_active` — фильтрация активных корпусов

---

## Таблица 2: `rooms` (Аудитории)

| Поле | Тип | Описание |
|------|-----|----------|
| id | SERIAL | Первичный ключ |
| name | VARCHAR(50) | Номер аудитории (уникальный) |
| building_id | INTEGER (FK) | Ссылка на корпус |
| floor | INTEGER | Этаж |
| capacity | INTEGER | Вместимость |
| has_projector | BOOLEAN | Наличие проектора |
| has_computers | BOOLEAN | Наличие компьютеров |
| has_whiteboard | BOOLEAN | Наличие доски |
| has_smartboard | BOOLEAN | Наличие интерактивной доски |
| room_type | VARCHAR(30) | Тип: classroom, lab, lecture_hall, seminar |
| description | TEXT | Дополнительное описание |
| extra_info | JSONB | Дополнительные параметры |

**Индексы:**
- `ix_rooms_name` (UNIQUE)
- `ix_rooms_building_id` — фильтрация по корпусу
- `ix_rooms_building_capacity` — составной индекс для типичных запросов

---

## Таблица 3: `schedule_entries` (Расписание)

| Поле | Тип | Описание |
|------|-----|----------|
| id | SERIAL | Первичный ключ |
| room_id | INTEGER (FK) | Ссылка на аудиторию |
| day_of_week | INTEGER | День: 0=Пн, 1=Вт, ... 6=Вс |
| week_type | VARCHAR(10) | odd/even/both — чётность недели |
| time_start | TIME | Время начала |
| time_end | TIME | Время окончания |
| time_slot_id | INTEGER (FK) | Ссылка на временной слот (nullable) |
| lesson_type_id | INTEGER (FK) | Ссылка на тип занятия |
| date | DATE | Дата (для разовых мероприятий) |
| is_recurring | BOOLEAN | Регулярное ли занятие |
| subject | VARCHAR(200) | Название дисциплины |
| teacher | VARCHAR(150) | Преподаватель |
| group_name | VARCHAR(100) | Группа |
| source_hash | VARCHAR(64) | Хеш источника (для дедупликации) |
| created_at | TIMESTAMP | Дата создания |
| updated_at | TIMESTAMP | Дата обновления |

**Ключевые составные индексы:**

```sql
-- Индекс для запроса "свободные аудитории"
CREATE INDEX ix_schedule_availability_query 
ON schedule_entries (day_of_week, time_start, time_end, week_type);

-- Индекс для проверки занятости конкретной аудитории
CREATE INDEX ix_schedule_room_day_time 
ON schedule_entries (room_id, day_of_week, time_start, time_end);

-- Индекс для фильтрации по чётности недели
CREATE INDEX ix_schedule_week_type 
ON schedule_entries (day_of_week, week_type);
```

---

## Таблица 4: `time_slots` (Временные слоты)

Стандартизированные академические часы.

| Поле | Тип | Описание |
|------|-----|----------|
| id | SERIAL | Первичный ключ |
| slot_number | INTEGER | Номер пары (1-8) |
| time_start | TIME | Время начала |
| time_end | TIME | Время окончания |
| label | VARCHAR(50) | Метка ("1 пара", "2 пара") |
| duration_type | VARCHAR(20) | standard (90 мин) / short (45 мин) |
| is_active | BOOLEAN | Активен ли слот |

---

## Таблица 5: `lesson_types` (Типы занятий)

| Поле | Тип | Описание |
|------|-----|----------|
| id | SERIAL | Первичный ключ |
| code | VARCHAR(50) | Код (lecture, practice, lab, seminar) |
| name | VARCHAR(100) | Полное название |
| short_name | VARCHAR(20) | Краткое название |
| color | VARCHAR(7) | HEX цвет для UI |

---

## Таблица 6: `equipment_types` (Типы оборудования)

| Поле | Тип | Описание |
|------|-----|----------|
| id | SERIAL | Первичный ключ |
| code | VARCHAR(50) | Код (projector, computers, etc.) |
| name | VARCHAR(100) | Название |
| icon | VARCHAR(50) | Иконка |

---

## Таблица 7: `room_equipment` (Связь аудитория-оборудование)

Реализует связь many-to-many между аудиториями и оборудованием.

| Поле | Тип | Описание |
|------|-----|----------|
| room_id | INTEGER (FK) | Ссылка на аудиторию (PK) |
| equipment_type_id | INTEGER (FK) | Ссылка на тип оборудования (PK) |
| quantity | INTEGER | Количество единиц |
| notes | VARCHAR(255) | Примечания |

---

## Пример SQL-запроса: Поиск свободных аудиторий

```sql
-- Найти свободные аудитории в корпусе 'a' на вторник, 14:00-15:30, нечётная неделя

SELECT r.*, b.name as building_name
FROM rooms r
JOIN buildings b ON r.building_id = b.id
WHERE b.code = 'a'
  AND r.capacity >= 20
  AND r.has_projector = true
  AND r.id NOT IN (
      SELECT room_id 
      FROM schedule_entries
      WHERE day_of_week = 1                                    -- Вторник
        AND week_type IN ('odd', 'both')                        -- Нечётная или каждая
        AND time_start < '15:30:00'                             -- Начало < конец запроса
        AND time_end > '14:00:00'                               -- Конец > начало запроса
  )
ORDER BY r.floor, r.name;
```

---

## Рекомендации по индексам

### Критически важные (для производительности)

```sql
-- 1. Основной запрос свободных аудиторий
CREATE INDEX CONCURRENTLY ix_schedule_availability_query 
ON schedule_entries (day_of_week, time_start, time_end, week_type);

-- 2. Проверка конкретной аудитории
CREATE INDEX CONCURRENTLY ix_schedule_room_day_time 
ON schedule_entries (room_id, day_of_week, time_start, time_end);

-- 3. Фильтрация по корпусу
CREATE INDEX CONCURRENTLY ix_rooms_building_capacity 
ON rooms (building_id, capacity);
```

### Дополнительные (для аналитики)

```sql
-- 4. Статистика по преподавателям
CREATE INDEX ix_schedule_teacher 
ON schedule_entries (teacher);

-- 5. Статистика по группам
CREATE INDEX ix_schedule_group 
ON schedule_entries (group_name);

-- 6. Поиск по дисциплинам
CREATE INDEX ix_schedule_subject 
ON schedule_entries USING gin(to_tsvector('russian', subject));
```

---

## Рекомендации по партиционированию

При масштабировании (>100k записей расписания):

```sql
-- Партиционирование schedule_entries по месяцам
CREATE TABLE schedule_entries_partitioned (
    id SERIAL,
    room_id INTEGER,
    day_of_week INTEGER,
    time_start TIME,
    time_end TIME,
    week_type VARCHAR(10),
    PRIMARY KEY (id, day_of_week)
) PARTITION BY RANGE (day_of_week);

-- Создать партиции для каждого дня недели
CREATE TABLE schedule_entries_mon PARTITION OF schedule_entries_partitioned
    FOR VALUES FROM (0) TO (1);
-- ... и т.д.
```

---

## Кэширование

Рекомендуемые TTL для кэша Redis:

| Данные | TTL | Причина |
|--------|-----|---------|
| Результаты поиска свободных аудиторий | 5 мин | Частые запросы |
| Список корпусов | 1 час | Меняется редко |
| Список аудиторий | 15 мин | Обновляется при синхронизации |
| Расписание аудитории | 10 мин | Зависит от дня/недели |

---

## Версионирование миграций

- `001_initial` — исходная схема
- `002_redesigned_schema` — нормализованная схема v2

Порядок применения:
```bash
alembic upgrade head
```
