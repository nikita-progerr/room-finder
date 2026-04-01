from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
import logging

from app.core.config import settings
from app.core.database import init_db
from app.api import rooms, admin, schedule, schedule_api

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(name)s: %(message)s",
)
logger = logging.getLogger(__name__)


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Инициализация при старте"""
    logger.info(f"Starting {settings.APP_NAME} v{settings.APP_VERSION}")
    await init_db()
    logger.info("Database initialized")
    yield
    logger.info("Shutting down...")


app = FastAPI(
    title=settings.APP_NAME,
    version=settings.APP_VERSION,
    description="""
## 🏫 Умный поиск свободных аудиторий

API для поиска свободных аудиторий на основе расписания занятий.

### Основные эндпоинты:
- `GET /rooms/free` — найти свободные аудитории прямо сейчас или в заданный интервал
- `GET /rooms/` — список всех аудиторий
- `GET /rooms/{id}/schedule` — расписание конкретной аудитории
- `POST /admin/parse/trigger` — обновить данные расписания
    """,
    lifespan=lifespan,
)

# CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.ALLOWED_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Роутеры
app.include_router(rooms.router,     prefix="/api/v1")
app.include_router(admin.router,     prefix="/api/v1")
app.include_router(schedule.router,  prefix="/api/v1")
app.include_router(schedule_api.router, prefix="/api/v1")


@app.get("/", tags=["Health"])
async def root():
    return {
        "service": settings.APP_NAME,
        "version": settings.APP_VERSION,
        "docs": "/docs",
        "status": "ok",
    }


@app.get("/health", tags=["Health"])
async def health_check():
    return {"status": "healthy"}
