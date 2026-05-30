from loguru import logger
from sqlalchemy import select, func
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.exceptions import ChunkNotFoundError, DocNotFoundError
from app.models.chunk import KbChunk
from app.models.document import KbDocument
from app.schemas.chunk import (
    ChunkItem,
    ChunkListResponse,
    ChunkUpdateResponse,
)
from app.services.embedding_service import embed_text


async def list_chunks(
    db: AsyncSession, doc_id: int, page: int = 1, page_size: int = 20
) -> ChunkListResponse:
    """分页获取文档的所有切片（排除已删除文档）。"""
    doc = (
        await db.execute(
            select(KbDocument).where(
                KbDocument.id == doc_id, KbDocument.deleted_at.is_(None)
            )
        )
    ).scalar_one_or_none()
    if doc is None:
        raise DocNotFoundError(f"文档不存在: id={doc_id}")

    count_query = select(func.count()).select_from(KbChunk).where(
        KbChunk.document_id == doc_id
    )
    total = (await db.execute(count_query)).scalar_one()

    offset = (page - 1) * page_size
    rows = (
        await db.execute(
            select(KbChunk)
            .where(KbChunk.document_id == doc_id)
            .order_by(KbChunk.chunk_index)
            .offset(offset)
            .limit(page_size)
        )
    ).scalars().all()

    items = [ChunkItem.model_validate(row) for row in rows]
    return ChunkListResponse(items=items, total=total, page=page, page_size=page_size)


async def update_chunk(
    db: AsyncSession, chunk_id: int, content: str
) -> ChunkUpdateResponse:
    """编辑切片内容并自动重向量化。"""
    chunk = (
        await db.execute(select(KbChunk).where(KbChunk.id == chunk_id))
    ).scalar_one_or_none()
    if chunk is None:
        raise ChunkNotFoundError(f"切片不存在: id={chunk_id}")

    embedding = await embed_text(content)
    chunk.content = content
    chunk.embedding = embedding

    await db.commit()
    await db.refresh(chunk)

    logger.info(f"切片更新完成: id={chunk_id} len={len(content)}")
    return ChunkUpdateResponse.model_validate(chunk)


async def delete_chunk(db: AsyncSession, chunk_id: int) -> None:
    """物理删除切片，并更新文档的 chunk_count -= 1。"""
    chunk = (
        await db.execute(select(KbChunk).where(KbChunk.id == chunk_id))
    ).scalar_one_or_none()
    if chunk is None:
        raise ChunkNotFoundError(f"切片不存在: id={chunk_id}")

    doc = (
        await db.execute(
            select(KbDocument).where(KbDocument.id == chunk.document_id)
        )
    ).scalar_one_or_none()

    await db.delete(chunk)

    if doc and doc.chunk_count > 0:
        doc.chunk_count -= 1

    await db.commit()
    logger.info(f"切片删除: id={chunk_id} doc_id={chunk.document_id}")
