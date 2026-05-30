from datetime import datetime
from typing import Optional

from pydantic import BaseModel

from app.schemas.common import PaginatedData


class OverviewResponse(BaseModel):
    total_documents: int
    active_documents: int
    disabled_documents: int
    processing_documents: int
    total_chunks: int
    total_qa_records: int
    avg_similarity: float
    total_storage_bytes: int
    last_ingestion_at: Optional[datetime]
    last_qa_at: Optional[datetime]


class FrequentQuestionItem(BaseModel):
    rank: int
    question: str
    count: int
    last_asked_at: datetime


class FrequentQuestionsResponse(BaseModel):
    items: list[FrequentQuestionItem]
    total_unique_questions: int


class UnansweredItem(BaseModel):
    id: int
    question: str
    created_at: datetime
    session_id: int


class UnansweredListResponse(PaginatedData[UnansweredItem]):
    pass
