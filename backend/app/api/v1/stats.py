from fastapi import APIRouter, Depends, Query
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.deps import get_db
from app.schemas.common import success_response
from app.services.stats_service import get_frequent_questions, get_kb_overview, get_unanswered

router = APIRouter(tags=["stats"])


@router.get("/stats/overview")
async def overview(db: AsyncSession = Depends(get_db)):
    """知识库运维概览 — 文档/切片/QA 聚合数据。"""
    result = await get_kb_overview(db)
    return success_response(result.model_dump())


@router.get("/stats/frequent-questions")
async def frequent_questions(
    top_n: int = Query(10, ge=1, le=100, description="返回前 N 条高频问题"),
    db: AsyncSession = Depends(get_db),
):
    """高频问题统计 — 按 question 前 50 字符分组聚合。"""
    result = await get_frequent_questions(db, top_n)
    return success_response(result.model_dump())


@router.get("/stats/unanswered")
async def unanswered(
    page: int = Query(1, ge=1, description="页码"),
    page_size: int = Query(20, ge=1, le=100, description="每页数量"),
    db: AsyncSession = Depends(get_db),
):
    """无答案问题列表 — ref_chunks 为空的 QA 记录。"""
    result = await get_unanswered(db, page, page_size)
    return success_response(result.model_dump())
