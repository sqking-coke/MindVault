from pathlib import Path
from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    model_config = {"env_file": ".env", "env_file_encoding": "utf-8"}

    # --- 应用 ---
    APP_ENV: str = "development"
    APP_DEBUG: bool = True
    API_KEY: str = "change-me-in-production"
    CORS_ORIGINS: str = "http://localhost:3000,http://localhost"
    RATE_LIMIT_ENABLED: bool = True

    # --- 数据库 ---
    DATABASE_URL: str = "postgresql+asyncpg://mindvaults:mindvaults@localhost:5432/mindvaults"

    # --- Redis ---
    REDIS_URL: str = "redis://localhost:6379"
    REDIS_CACHE_TTL: int = 3600
    REDIS_CACHE_ENABLED: bool = True

    # --- LLM ---
    LLM_BASE_URL: str = "http://localhost:11434/v1"
    LLM_MODEL: str = "qwen3"

    # --- Embedding ---
    EMBEDDING_MODEL: str = "BAAI/bge-large-zh-v1.5"
    EMBEDDING_DIM: int = 1024

    # --- 上传 ---
    UPLOAD_DIR: str = str(Path(__file__).resolve().parent.parent / "uploads")
    MAX_UPLOAD_SIZE_MB: int = 50
    ALLOWED_EXTENSIONS: str = "txt,md,pdf,docx,doc"

    # --- 日志 ---
    LOG_LEVEL: str = "INFO"
    LOG_DIR: str = str(Path(__file__).resolve().parent.parent / "logs")
    LOG_RETENTION: int = 30

    @property
    def allowed_extensions_list(self) -> list[str]:
        return [ext.strip() for ext in self.ALLOWED_EXTENSIONS.split(",")]


settings = Settings()
