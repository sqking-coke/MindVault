import asyncio

from loguru import logger
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.chunk import KbChunk
from app.models.document import KbDocument, DOC_STATUS_PROCESSING, DOC_STATUS_COMPLETED, DOC_STATUS_FAILED
from app.models.config import KbConfig
from app.services.parser_service import parse_document
from app.services.chunking_service import chunk_text
from app.services.embedding_service import embed_text


async def ingest_document(db: AsyncSession, doc_id: int, doc_type: str, file_path: str) -> None:
    """文档摄入管道：解析 → 切片 → 向量化 → 入库。"""
    try:
        # 0. 标记为处理中
        doc = (
            await db.execute(select(KbDocument).where(KbDocument.id == doc_id))
        ).scalar_one_or_none()
        if doc is None:
            logger.error(f"文档不存在: id={doc_id}")
            return
        doc.status = DOC_STATUS_PROCESSING
        await db.flush()

        # 1. 解析文档
        text = await parse_document(file_path, doc_type)
        if not text:
            logger.warning(f"文档解析无内容: id={doc_id} path={file_path}")
            doc.status = DOC_STATUS_FAILED
            await db.commit()
            return

        # 2. 读取配置
        config = await _get_or_create_config(db)
        # 3. 切片（默认 semantic 语义模式，利用 langchain 分隔符拆分）
        chunks_text = await chunk_text(
            text,
            chunk_size=config.chunk_size,
            chunk_overlap=config.chunk_overlap,
            mode="semantic",
        )
        if not chunks_text:
            logger.warning(f"文档切片为空: id={doc_id}")
            doc.status = DOC_STATUS_FAILED
            await db.commit()
            return

        # 4. 向量化 + 入库（逐条处理，避免内存溢出）
        for idx, chunk_content in enumerate(chunks_text):
            try:
                embedding = await embed_text(chunk_content)
            except Exception as exc:
                logger.error(f"向量生成失败: doc_id={doc_id} chunk={idx} — {exc}")
                continue

            chunk_record = KbChunk(
                document_id=doc_id,
                chunk_index=idx,
                content=chunk_content,
                embedding=embedding,
            )
            db.add(chunk_record)

        await db.flush()

        # 5. 更新文档状态：完成
        doc.chunk_count = len(chunks_text)
        doc.status = DOC_STATUS_COMPLETED
        await db.commit()
        logger.info(
            f"文档摄入完成: id={doc_id} type={doc_type} chunks={len(chunks_text)}"
        )

    except Exception as exc:
        logger.error(f"文档摄入异常: id={doc_id} — {exc}")
        await db.rollback()
        # 尝试将文档标记为失败（需要新事务）
        try:
            doc = (
                await db.execute(select(KbDocument).where(KbDocument.id == doc_id))
            ).scalar_one_or_none()
            if doc:
                doc.status = DOC_STATUS_FAILED
                await db.commit()
        except Exception as inner_exc:
            logger.error(f"更新文档失败状态异常: id={doc_id} — {inner_exc}")


def schedule_ingestion(
    db_factory, doc_id: int, doc_type: str, file_path: str
) -> None:
    """在后台异步调度文档摄入，不阻塞上传响应。"""
    async def _run():
        async with db_factory() as session:
            await ingest_document(session, doc_id, doc_type, file_path)

    try:
        loop = asyncio.get_running_loop()
        loop.create_task(_run())
    except RuntimeError:
        logger.warning("没有运行中的 event loop，跳过后台摄入调度")


async def _get_or_create_config(db: AsyncSession) -> KbConfig:
    row = (
        await db.execute(select(KbConfig).where(KbConfig.id == 1))
    ).scalar_one_or_none()
    if row is None:
        row = KbConfig()
        db.add(row)
        await db.flush()
    return row
