from pydantic_settings import BaseSettings
from typing import Optional


class Settings(BaseSettings):
    # App
    APP_NAME: str = "Smart Room Finder"
    APP_VERSION: str = "1.0.0"
    DEBUG: bool = False

    # Database
    DATABASE_URL: str = "postgresql+asyncpg://postgres:postgres@db:5432/smartrooms"
    DATABASE_URL_SYNC: str = "postgresql://postgres:postgres@db:5432/smartrooms"

    # Redis
    REDIS_URL: str = "redis://redis:6379/0"
    CACHE_TTL: int = 300  # 5 минут

    # Celery
    CELERY_BROKER_URL: str = "redis://redis:6379/1"
    CELERY_RESULT_BACKEND: str = "redis://redis:6379/2"

    # Parser
    SCHEDULE_URL: str = "https://sarfti.ru/?page_id=20"
    PARSE_INTERVAL_HOURS: int = 6
    PARSER_REQUEST_TIMEOUT: int = 30
    PARSER_MAX_RETRIES: int = 3

    # CORS
    ALLOWED_ORIGINS: list[str] = ["http://localhost:3000", "http://localhost:3001"]

    class Config:
        env_file = ".env"
        case_sensitive = True


settings = Settings()
