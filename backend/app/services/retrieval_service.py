from loguru import logger
from sqlalchemy import select, func
from sqlalchemy.ext.asyncio import AsyncSession

from app.config import settings
from app.core.redis import get_redis
from app.models.chunk import KbChunk
from app.models.document import KbDocument, DOC_STATUS_COMPLETED
from app.models.config import KbConfig
from app.schemas.chat import RefChunk
from app.services.cache_service import CacheService


async def get_config(db: AsyncSession) -> KbConfig:
    row = (await db.execute(select(KbConfig).where(KbConfig.id == 1))).scalar_one_or_none()
    if row is None:
        row = KbConfig()
        db.add(row)
        await db.flush()
    return row


async def _pgvector_search(
    db: AsyncSession,
    query_embedding: list[float],
    k: int,
    thresh: float,
) -> list[RefChunk]:
    """pgvector HNSW 语义检索，返回相似切片列表（按相似度降序）。"""
    similarity_expr = 1.0 - func.cosine_distance(KbChunk.embedding, query_embedding)

    stmt = (
        select(
            KbChunk.id.label("chunk_id"),
            KbDocument.doc_name,
            KbChunk.content,
            similarity_expr.label("similarity"),
            KbChunk.page,
        )
        .join(KbDocument, KbChunk.document_id == KbDocument.id)
        .where(
            KbDocument.deleted_at.is_(None),
            KbDocument.status == DOC_STATUS_COMPLETED,
            func.cosine_distance(KbChunk.embedding, query_embedding) <= 1.0 - thresh,
        )
        .order_by(similarity_expr.desc())
        .limit(k)
    )

    rows = (await db.execute(stmt)).all()
    logger.info(f"pgvector 检索完成: top_k={k} threshold={thresh} hits={len(rows)}")

    return [
        RefChunk(
            chunk_id=row.chunk_id,
            doc_name=row.doc_name,
            content=row.content,
            similarity=round(row.similarity, 4),
            page=row.page,
        )
        for row in rows
    ]


async def retrieve_chunks(
    db: AsyncSession,
    query_embedding: list[float],
    top_k: int | None = None,
    threshold: float | None = None,
) -> list[RefChunk]:
    """语义检索（Redis 缓存 + pgvector 降级）。先查缓存，未命中时走 pgvector。"""
    cfg = await get_config(db)
    k = top_k if top_k is not None else cfg.top_k
    thresh = threshold if threshold is not None else cfg.similarity_threshold

    # —— 优先读缓存 ——
    cache = None
    if settings.REDIS_CACHE_ENABLED:
        try:
            redis = await get_redis()
            cache = CacheService(redis)
            cached = await cache.get_retrieval(query_embedding)
            if cached:
                logger.info(f"检索缓存命中: chunks={len(cached)}")
                return cached
        except Exception:
            logger.opt(exception=True).warning("Redis 不可用，降级至 pgvector")

    # —— 缓存未命中，走 pgvector ——
    chunks = await _pgvector_search(db, query_embedding, k, thresh)

    # —— 回写缓存 ——
    if cache is not None and chunks:
        try:
            await cache.set_retrieval(query_embedding, chunks)
        except Exception:
            logger.opt(exception=True).warning("检索缓存回写失败")

    return chunks
