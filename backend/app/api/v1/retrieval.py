import time

from fastapi import APIRouter, Depends
from loguru import logger
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.deps import get_db
from app.core.exceptions import DocNotFoundError
from app.models.chunk import KbChunk
from app.models.document import KbDocument
from app.schemas.common import success_response
from app.schemas.retrieval import (
    ChunkPreviewResponse,
    RetrievalTestRequest,
)
from app.services.embedding_service import embed_text
from app.services.retrieval_service import retrieve_chunks

router = APIRouter(tags=["retrieval"])


@router.post("/retrieval/test")
async def retrieval_test(req: RetrievalTestRequest, db: AsyncSession = Depends(get_db)):
    t0 = time.perf_counter()
    embedding = await embed_text(req.query)
    results = await retrieve_chunks(db, embedding, req.top_k, req.threshold)
    elapsed_ms = round((time.perf_counter() - t0) * 1000)
    logger.info(f"检索测试完成: query={req.query[:50]} top_k={req.top_k} threshold={req.threshold} elapsed={elapsed_ms}ms hits={len(results)}")
    return success_response({"results": [r.model_dump() for r in results], "elapsed_ms": elapsed_ms})


@router.get("/chunks/{chunk_id}/preview")
async def chunk_preview(chunk_id: int, db: AsyncSession = Depends(get_db)):
    row = (await db.execute(
        select(KbChunk, KbDocument.doc_name)
        .join(KbDocument, KbChunk.document_id == KbDocument.id)
        .where(KbChunk.id == chunk_id, KbDocument.deleted_at.is_(None))
    )).one_or_none()

    if row is None:
        raise DocNotFoundError(f"切片不存在: id={chunk_id}")

    chunk, doc_name = row
    return success_response(ChunkPreviewResponse(
        chunk_id=chunk.id,
        doc_name=doc_name,
        preview=chunk.content,
        similarity=0.0,
    ).model_dump())


