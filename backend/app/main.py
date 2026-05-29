import sys
from pathlib import Path
from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from loguru import logger
from slowapi.errors import RateLimitExceeded
from slowapi import _rate_limit_exceeded_handler

from app.config import settings
from app.api.v1.router import api_router, public_router
from app.core.database import engine
from app.core.exceptions import (
    AppException,
    app_exception_handler,
    unhandled_exception_handler,
)
from app.core.middleware import limiter, request_log_middleware


@asynccontextmanager
async def lifespan(app: FastAPI):
    logger.info(f"MindVault starting (env={settings.APP_ENV})")
    yield
    await engine.dispose()
    logger.info("MindVault shut down")


def create_app() -> FastAPI:
    app = FastAPI(
        title="MindVault API",
        description="本地私有知识库问答系统",
        version="0.1.0",
        lifespan=lifespan,
    )

    # CORS
    origins = [o.strip() for o in settings.CORS_ORIGINS.split(",")]
    app.add_middleware(
        CORSMiddleware,
        allow_origins=origins,
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )

    # 请求日志中间件
    app.middleware("http")(request_log_middleware)

    # 全局异常处理器
    app.add_exception_handler(AppException, app_exception_handler)
    app.add_exception_handler(Exception, unhandled_exception_handler)
    app.add_exception_handler(RateLimitExceeded, _rate_limit_exceeded_handler)

    # 路由注册
    app.include_router(public_router)
    app.include_router(api_router)

    # slowapi 限流
    app.state.limiter = limiter
    if not settings.RATE_LIMIT_ENABLED:
        limiter.enabled = False

    return app


def _setup_logging() -> None:
    logger.remove()
    logger.add(
        sys.stderr,
        level=settings.LOG_LEVEL,
        format="<green>{time:YYYY-MM-DD HH:mm:ss}</green> | <level>{level: <8}</level> | <cyan>{name}</cyan>:<cyan>{function}</cyan>:<cyan>{line}</cyan> | <level>{message}</level>",
    )
    log_dir = Path(settings.LOG_DIR)
    log_dir.mkdir(parents=True, exist_ok=True)
    logger.add(
        log_dir / "mindvault_{time:YYYY-MM-DD}.log",
        level=settings.LOG_LEVEL,
        rotation="00:00",
        retention=f"{settings.LOG_RETENTION} days",
        encoding="utf-8",
    )


_setup_logging()
app = create_app()
