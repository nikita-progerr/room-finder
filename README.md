# 🏫 Умный поиск свободных аудиторий

> Веб-приложение для быстрого поиска свободных аудиторий в вузе на основе данных расписания.

---

## 📐 Архитектура системы

```
┌─────────────────────────────────────────────────────────────┐
│                        CLIENT LAYER                         │
│              React / Next.js (Vercel / Nginx)               │
└──────────────────────────┬──────────────────────────────────┘
                           │ HTTP REST API
┌──────────────────────────▼──────────────────────────────────┐
│                       API LAYER                             │
│              FastAPI (Python 3.11+)                         │
│   /rooms/free  /rooms/:id  /schedule  /analytics           │
└──────┬────────────────────────────────────────┬────────────┘
       │                                        │
┌──────▼──────┐                    ┌────────────▼───────────┐
│  PostgreSQL  │                    │    Redis (Cache TTL)   │
│  (основная   │                    │  расписание, сессии    │
│    БД)       │                    └────────────────────────┘
└──────┬──────┘
       │
┌──────▼──────────────────────────────────────────────────────┐
│                    BACKGROUND TASKS                         │
│              Celery + Redis (Broker)                        │
│   ┌──────────────────┐    ┌────────────────────────────┐   │
│   │  Парсер (Cron)   │    │  Анализатор расписания     │   │
│   │  каждые 6 часов  │    │  Определение занятости     │   │
│   └──────────────────┘    └────────────────────────────┘   │
└─────────────────────────────────────────────────────────────┘
```

## 🔄 Поток данных (Data Flow)

```
sarfti.ru/расписание
        │
        ▼
  [Парсер: BeautifulSoup]
  Извлечение: аудитория, пара, день, группа, предмет
        │
        ▼
  [Нормализатор]
  Структурирование, дедупликация, валидация
        │
        ▼
  [PostgreSQL: таблица schedule_entries]
  Хранение всех занятий с временными метками
        │
        ▼
  [FastAPI: /rooms/free?time=now&building=A]
  SQL-запрос: аудитории БЕЗ занятий в заданный интервал
        │
        ▼
  [Redis Cache TTL=5min]
  Кэширование популярных запросов
        │
        ▼
  [React Frontend]
  Список свободных аудиторий + фильтры
```

## 🧠 Алгоритм поиска свободных аудиторий

```
ВХОД: time_start, time_end, day_of_week, filters

1. Получить все аудитории из БД: SET all_rooms
2. Получить занятые аудитории:
   SELECT DISTINCT room_id FROM schedule_entries
   WHERE day_of_week = ?
     AND NOT (time_end <= time_start OR time_start >= time_end)
   → SET busy_rooms

3. free_rooms = all_rooms - busy_rooms

4. Применить фильтры (корпус, вместимость, оборудование)

5. Сортировка по вместимости / этажу

ВЫХОД: список свободных аудиторий
```

## 🚀 Быстрый старт

```bash
# Клонирование
git clone https://github.com/your-org/smart-room-finder
cd smart-room-finder

# Запуск через Docker Compose
docker-compose up --build

# Backend: http://localhost:8000
# Frontend: http://localhost:3001
# API Docs: http://localhost:8000/docs
```

## 📁 Структура проекта

```
smart-room-finder/
├── backend/                 # FastAPI приложение
│   ├── app/
│   │   ├── api/            # Роуты FastAPI
│   │   ├── core/           # Конфигурация, безопасность
│   │   ├── models/         # SQLAlchemy модели
│   │   ├── schemas/        # Pydantic схемы
│   │   ├── services/       # Бизнес-логика
│   │   └── tasks/          # Celery задачи (парсер)
│   ├── tests/
│   └── requirements.txt
├── frontend/               # React / Next.js
│   └── src/
│       ├── components/     # UI компоненты
│       ├── pages/          # Страницы
│       ├── hooks/          # Кастомные хуки
│       ├── services/       # API клиент
│       └── store/          # Zustand стейт
├── docker/                 # Dockerfile'ы
├── docker-compose.yml
└── docs/                   # Документация
```

## ⚠️ Известные проблемы и решения

| Проблема | Решение |
|----------|---------|
| Нестабильная структура HTML расписания | Несколько стратегий парсинга + fallback + алерты |
| Задержка обновления данных | TTL кэш + ручной trigger обновления |
| Ошибки парсинга | Retry-логика, логирование, graceful degradation |
| Нагрузка на сайт вуза | Rate limiting, кэш на 6ч, не парсить в пиковые часы |
