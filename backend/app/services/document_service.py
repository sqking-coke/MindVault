import shutil
import uuid
from datetime import datetime, timezone
from pathlib import Path

from fastapi import UploadFile
from loguru import logger
from sqlalchemy import select, func
from sqlalchemy.ext.asyncio import AsyncSession

from app.config import settings
from app.core.exceptions import (
    DocNotFoundError,
    DocFormatUnsupportedError,
    DocSizeExceededError,
)
from app.models.document import KbDocument, DOC_STATUS_PROCESSING
from app.schemas.document import (
    DocumentResponse,
    DocumentListItem,
    DocumentUploadResponse,
    DocumentListResponse,
    DocumentUpdateRequest,
)
from app.services.ingestion_service import schedule_ingestion
from app.core.database import AsyncSessionLocal


def _validate_file(file: UploadFile) -> str:
    """校验单个文件的扩展名和大小。返回小写扩展名。"""
    if not file.filename:
        raise DocFormatUnsupportedError("文件名为空")

    ext = Path(file.filename).suffix.lstrip(".").lower()
    if ext not in settings.allowed_extensions_list:
        raise DocFormatUnsupportedError(
            f"不支持的文件格式 .{ext}，允许: {settings.ALLOWED_EXTENSIONS}"
        )
    return ext


def _validate_file_size(file: UploadFile) -> None:
    """校验单个文件大小（需先 read 才能获取 size，调用方负责 seek）。"""
    if file.size is not None and file.size > settings.MAX_UPLOAD_SIZE_MB * 1024 * 1024:
        raise DocSizeExceededError(
            f"文件大小 {file.size / 1024 / 1024:.1f}MB 超出限制 {settings.MAX_UPLOAD_SIZE_MB}MB"
        )


async def upload_documents(
    db: AsyncSession, files: list[UploadFile]
) -> DocumentUploadResponse:
    """批量上传文档：校验 → 落盘 → 建记录。"""
    upload_dir = Path(settings.UPLOAD_DIR)
    upload_dir.mkdir(parents=True, exist_ok=True)

    documents: list[DocumentListItem] = []

    for file in files:
        ext = _validate_file(file)
        _validate_file_size(file)

        # 生成唯一文件名，保留原始扩展名
        stored_name = f"{uuid.uuid4().hex}.{ext}"
        dest_path = upload_dir / stored_name

        try:
            with open(dest_path, "wb") as buffer:
                shutil.copyfileobj(file.file, buffer)
        except Exception as exc:
            logger.error(f"文件写入失败: {dest_path} — {exc}")
            if dest_path.exists():
                dest_path.unlink()
            raise

        doc = KbDocument(
            doc_name=file.filename or stored_name,
            doc_type=ext,
            file_path=str(dest_path),
            status=DOC_STATUS_PROCESSING,
            chunk_count=0,
        )
        db.add(doc)
        await db.flush()

        documents.append(
            DocumentListItem(
                id=doc.id,
                doc_name=doc.doc_name,
                status=doc.status,
                chunk_count=doc.chunk_count,
            )
        )

        # 调度后台摄入管道（解析→切片→向量化→入库）
        schedule_ingestion(AsyncSessionLocal, doc.id, ext, str(dest_path))

        logger.info(f"文档上传成功: id={doc.id} name={doc.doc_name} type={ext}")

    await db.commit()
    return DocumentUploadResponse(documents=documents, total=len(documents))


async def list_documents(
    db: AsyncSession, page: int = 1, page_size: int = 20
) -> DocumentListResponse:
    """分页查询文档列表（排除已软删除）。"""
    base_query = select(KbDocument).where(KbDocument.deleted_at.is_(None))
    count_query = select(func.count()).select_from(KbDocument).where(
        KbDocument.deleted_at.is_(None)
    )

    total = (await db.execute(count_query)).scalar_one()
    offset = (page - 1) * page_size
    rows = (
        await db.execute(
            base_query.order_by(KbDocument.created_at.desc())
            .offset(offset)
            .limit(page_size)
        )
    ).scalars().all()

    items = [DocumentResponse.model_validate(row) for row in rows]
    return DocumentListResponse(items=items, total=total, page=page, page_size=page_size)


async def get_document(db: AsyncSession, doc_id: int) -> DocumentResponse:
    """获取单文档详情（排除已软删除）。"""
    row = (
        await db.execute(
            select(KbDocument).where(
                KbDocument.id == doc_id, KbDocument.deleted_at.is_(None)
            )
        )
    ).scalar_one_or_none()

    if row is None:
        raise DocNotFoundError(f"文档不存在: id={doc_id}")
    return DocumentResponse.model_validate(row)


async def update_document(
    db: AsyncSession, doc_id: int, data: DocumentUpdateRequest
) -> DocumentResponse:
    """更新文档名称/描述。"""
    row = (
        await db.execute(
            select(KbDocument).where(
                KbDocument.id == doc_id, KbDocument.deleted_at.is_(None)
            )
        )
    ).scalar_one_or_none()

    if row is None:
        raise DocNotFoundError(f"文档不存在: id={doc_id}")

    update_data = data.model_dump(exclude_unset=True)
    for key, value in update_data.items():
        setattr(row, key, value)

    await db.commit()
    await db.refresh(row)
    return DocumentResponse.model_validate(row)


async def soft_delete_document(db: AsyncSession, doc_id: int) -> None:
    """软删除文档：设置 deleted_at 时间戳。"""
    row = (
        await db.execute(
            select(KbDocument).where(
                KbDocument.id == doc_id, KbDocument.deleted_at.is_(None)
            )
        )
    ).scalar_one_or_none()

    if row is None:
        raise DocNotFoundError(f"文档不存在: id={doc_id}")

    row.deleted_at = datetime.now(timezone.utc)
    await db.commit()
    logger.info(f"文档软删除: id={doc_id} name={row.doc_name}")
