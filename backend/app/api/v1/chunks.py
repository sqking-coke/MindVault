from fastapi import APIRouter, Depends, Query
from sqlalchemy import select, func
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.deps import get_db
from app.core.exceptions import ChunkNotFoundError
from app.models.chunk import KbChunk
from app.schemas.common import success_response
from app.schemas.chunk import ChunkUpdateRequest
from app.schemas.retrieval import ChunkLocateResponse
from app.services.chunk_service import list_chunks, update_chunk, delete_chunk

router = APIRouter(tags=["chunks"])


@router.get("/documents/{doc_id}/chunks")
async def get_doc_chunks(
    doc_id: int,
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
    db: AsyncSession = Depends(get_db),
):
    """获取文档所有切片（分页）。"""
    result = await list_chunks(db, doc_id, page, page_size)
    return success_response(result.model_dump())


@router.put("/chunks/{chunk_id}")
async def edit_chunk(
    chunk_id: int,
    body: ChunkUpdateRequest,
    db: AsyncSession = Depends(get_db),
):
    """编辑切片内容（自动重向量化）。"""
    result = await update_chunk(db, chunk_id, body.content)
    return success_response(result.model_dump())


@router.delete("/chunks/{chunk_id}")
async def remove_chunk(chunk_id: int, db: AsyncSession = Depends(get_db)):
    """删除切片（物理删除 + 更新文档 chunk_count）。"""
    await delete_chunk(db, chunk_id)
    return success_response(None)


@router.post("/chunks/{chunk_id}/locate")
async def chunk_locate(chunk_id: int, db: AsyncSession = Depends(get_db)):
    """切片定位，返回真实 PDF 页码。"""
    chunk = (
        await db.execute(select(KbChunk).where(KbChunk.id == chunk_id))
    ).scalar_one_or_none()
    if chunk is None:
        raise ChunkNotFoundError(f"切片不存在: id={chunk_id}")

    offset_stmt = select(func.coalesce(func.sum(func.length(KbChunk.content)), 0)).where(
        KbChunk.document_id == chunk.document_id,
        KbChunk.chunk_index < chunk.chunk_index,
    )
    offset = (await db.execute(offset_stmt)).scalar() or 0

    return success_response(
        ChunkLocateResponse(
            chunk_id=chunk.id,
            page=chunk.page or 0,
            offset=offset,
            highlight_anchor=chunk.content[:120],
        ).model_dump()
    )
