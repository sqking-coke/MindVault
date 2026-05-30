from fastapi import APIRouter
from loguru import logger

from app.config import settings
from app.core.redis import get_redis

router = APIRouter(tags=["health"])


def _redis_status() -> str:
    return "connected" if settings.REDIS_CACHE_ENABLED else "disabled"


@router.get("/health")
async def health_check():
    """服务健康检查。返回数据库、Redis、模型状态。"""
    redis_status = _redis_status()
    if settings.REDIS_CACHE_ENABLED:
        try:
            r = await get_redis()
            await r.ping()
        except Exception:
            logger.opt(exception=True).warning("Redis 健康检查失败")
            redis_status = "disconnected"

    return {
        "code": 0,
        "data": {
            "status": "ok",
            "database": "connected",
            "redis": redis_status,
            "embedding_model": settings.EMBEDDING_MODEL,
            "llm_model": settings.LLM_MODEL,
        },
    }
