from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from loguru import logger

from app.config import settings
from app.api.v1.router import api_router
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
    app.add_middleware(
        CORSMiddleware,
        allow_origins=["http://localhost:3000", "http://localhost"],
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )

    # 请求日志中间件
    app.middleware("http")(request_log_middleware)

    # 全局异常处理器
    app.add_exception_handler(AppException, app_exception_handler)
    app.add_exception_handler(Exception, unhandled_exception_handler)

    # 路由注册
    app.include_router(api_router)

    # slowapi 限流
    app.state.limiter = limiter

    return app


app = create_app()
