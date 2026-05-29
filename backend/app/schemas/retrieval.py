from typing import Optional

from pydantic import BaseModel, Field

from app.schemas.chat import RefChunk


# --- 请求模型 ---

class RetrievalTestRequest(BaseModel):
    query: str = Field(..., min_length=1, max_length=5000)
    top_k: Optional[int] = Field(default=None, ge=1, le=100)
    threshold: Optional[float] = Field(default=None, ge=0.0, le=1.0)


# --- 响应模型 ---

class RetrievalTestResponse(BaseModel):
    results: list[RefChunk]
    elapsed_ms: int


class ChunkPreviewResponse(BaseModel):
    chunk_id: int
    doc_name: str
    preview: str
    similarity: float

    model_config = {"from_attributes": True}


class ChunkLocateResponse(BaseModel):
    chunk_id: int
    page: int
    offset: int
    highlight_anchor: str
