# Архитектура и известные проблемы

## Общая архитектура (Client-Server)

```
Browser / Mobile
      |
      |  HTTPS REST (JSON)
      v
+--------------------------+
|   Next.js (Frontend)     |  <- Vercel / Nginx
|   React + Tailwind CSS   |
|   Zustand (state)        |
+-------------+------------+
              |
              |  /api/v1/*
              v
+--------------------------+
|   FastAPI (Backend)      |  <- Render / AWS ECS
|   Python 3.11            |
|   Async SQLAlchemy       |
+---+----------+-----------+
    |          |
    v          v
PostgreSQL    Redis
(данные)   (кэш + очередь)
               |
               v
+--------------------------+
|   Celery Worker          |
|   + Beat (scheduler)     |
|   Парсер каждые 6ч       |
+--------------------------+
```

## Модули системы

### 1. Парсер расписания (backend/app/services/parser.py)
- Загружает страницу sarfti.ru с retry-логикой
- Проверяет MD5-хэш — если не изменилась, пропускает
- Стратегия 1: парсинг HTML-таблиц (_parse_tables)
- Стратегия 2 (fallback): парсинг div-блоков (_parse_divs)
- Нормализует форматы времени, дни недели, чётность

### 2. Celery задачи (backend/app/tasks/)
- celery_tasks.py — задача parse_and_update_schedule, запускается каждые 6ч
- db_sync.py — синхронная запись в БД через psycopg2
- Flower UI: http://localhost:5555 — мониторинг задач

### 3. API сервер (backend/app/api/)
- rooms.py — /rooms/free, /rooms/, /rooms/{id}/schedule
- admin.py — /admin/parse/trigger, /admin/stats, /admin/parse/logs

### 4. Сервис поиска (backend/app/services/room_service.py)

Алгоритм определения занятости:

  Аудитория ЗАНЯТА если:
  SELECT room_id FROM schedule_entries
  WHERE day_of_week = :day
    AND time_start < :q_end    -- занятие началось ДО конца запроса
    AND time_end > :q_start    -- занятие заканчивается ПОСЛЕ начала запроса
    AND week_type IN (:week_type, 'both')

  Свободные = все аудитории МИНУС занятые

### 5. База данных

  rooms                    schedule_entries          parse_logs
  ---------------------    --------------------      ----------------
  id (PK)                  id (PK)                   id (PK)
  name                     room_id (FK->rooms)       started_at
  building                 day_of_week               finished_at
  floor                    week_type                 status
  capacity                 time_start                entries_parsed
  has_projector            time_end                  entries_created
  has_computers            subject                   entries_updated
  has_whiteboard           teacher                   error_message
  has_smartboard           group_name
  room_type                lesson_type

### 6. Фронтенд (frontend/src/)
- store/roomStore.ts — Zustand: состояние поиска, фильтры
- services/api.ts — Axios клиент к FastAPI
- components/SearchFilters.tsx — панель фильтров
- components/RoomList.tsx — сетка карточек
- components/RoomCard.tsx — карточка аудитории
- components/RoomScheduleModal.tsx — модал с расписанием

## Поток данных (Data Flow)

  1. [Cron / Ручной триггер]
  2. Celery Worker: fetch sarfti.ru
  3. Parser: HTML -> list[ParsedLesson]
  4. db_sync: INSERT/UPDATE schedule_entries + rooms
  5. Redis cache flush (сбрасываем устаревший кэш)

  -- Запрос пользователя --

  6. User: GET /rooms/free?time_start=09:00&building=A
  7. FastAPI -> cache_get(key) -> HIT? -> вернуть из Redis
                                -> MISS
  8. SQL: SELECT rooms WHERE NOT IN (busy_subquery)
  9. Для каждой комнаты: найти "свободна до..."
  10. cache_set(key, result, ttl=300)
  11. JSON -> React -> RoomCard[]

## Проблемы и решения

  Нестабильная HTML-структура
  -> 2 стратегии парсинга + ParseLog + алерты

  Сайт вуза недоступен
  -> Retry (3 попытки) + graceful degradation (работаем с кэшем)

  Задержка обновления
  -> Ручной trigger через API + кнопка "Обновить"

  Нагрузка на сайт вуза
  -> Rate limiting, интервал 6ч, кэш хэша страницы

  Ошибки в данных расписания
  -> Валидация в парсере, UNKNOWN комнаты пропускаются

  Высокая нагрузка на API
  -> Redis кэш TTL=5мин, индексы в БД на room_id, day_of_week

## MVP — Минимальный набор функций

  [x] Поиск по текущему времени (NOW)
  [x] Поиск по заданному интервалу
  [x] Фильтр по корпусу
  [x] Фильтр по вместимости
  [x] Фильтр по оборудованию
  [x] Базовый парсер расписания
  [x] Карточки аудиторий с "свободна до..."
  [x] Расписание аудитории по клику
  [x] Ручное обновление расписания

Post-MVP:
  [ ] Push-уведомления (WebSocket / FCM)
  [ ] Бронирование аудитории
  [ ] Мобильное приложение (React Native)
  [ ] Аналитика использования
  [ ] Масштабирование на другие вузы
