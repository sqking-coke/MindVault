import redis.asyncio as aioredis
from loguru import logger

from app.config import settings

_redis_pool: aioredis.Redis | None = None


async def get_redis() -> aioredis.Redis:
    global _redis_pool
    if _redis_pool is None:
        _redis_pool = aioredis.from_url(
            settings.REDIS_URL,
            decode_responses=True,
            max_connections=10,
            socket_connect_timeout=2,
            socket_timeout=2,
        )
        logger.info(f"Redis 连接池已创建: {settings.REDIS_URL}")
    return _redis_pool


async def close_redis() -> None:
    global _redis_pool
    if _redis_pool is not None:
        await _redis_pool.close()
        _redis_pool = None
        logger.info("Redis 连接池已关闭")
