from fastapi import APIRouter, Depends, File, Query, Request, UploadFile
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.deps import get_db
from app.core.middleware import limiter
from app.schemas.common import success_response
from app.schemas.document import (
    DocumentResponse,
    DocumentUploadResponse,
    DocumentListResponse,
    DocumentUpdateRequest,
)
from app.services.document_service import (
    upload_documents,
    list_documents,
    get_document,
    update_document,
    soft_delete_document,
)

router = APIRouter(tags=["documents"])


@router.post("/documents")
@limiter.limit("10/minute")
async def upload(
    request: Request,
    files: list[UploadFile] = File(..., description="上传文件列表"),
    db: AsyncSession = Depends(get_db),
):
    """批量上传文档（multipart/form-data）。"""
    result: DocumentUploadResponse = await upload_documents(db, files)
    return success_response(result.model_dump())


@router.get("/documents")
async def list_docs(
    page: int = Query(1, ge=1, description="页码"),
    page_size: int = Query(20, ge=1, le=100, description="每页数量"),
    db: AsyncSession = Depends(get_db),
):
    """分页查询文档列表。"""
    result: DocumentListResponse = await list_documents(db, page, page_size)
    return success_response(result.model_dump())


@router.get("/documents/{doc_id}")
async def get_doc(doc_id: int, db: AsyncSession = Depends(get_db)):
    """获取单个文档详情。"""
    result: DocumentResponse = await get_document(db, doc_id)
    return success_response(result.model_dump())


@router.put("/documents/{doc_id}")
async def update_doc(
    doc_id: int,
    body: DocumentUpdateRequest,
    db: AsyncSession = Depends(get_db),
):
    """更新文档名称或描述。"""
    result: DocumentResponse = await update_document(db, doc_id, body)
    return success_response(result.model_dump())


@router.delete("/documents/{doc_id}")
async def delete_doc(doc_id: int, db: AsyncSession = Depends(get_db)):
    """软删除文档。"""
    await soft_delete_document(db, doc_id)
    return success_response(None)
