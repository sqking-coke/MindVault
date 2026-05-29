from loguru import logger

import httpx

from app.config import settings
from app.core.exceptions import EmbeddingUnavailableError


async def embed_text(text: str) -> list[float]:
    """调用 Ollama Embedding 接口，返回向量。"""
    url = f"{settings.LLM_BASE_URL.rstrip('/')}/api/embeddings"
    payload = {"model": settings.EMBEDDING_MODEL, "prompt": text}

    try:
        async with httpx.AsyncClient(timeout=30.0) as client:
            resp = await client.post(url, json=payload)
            resp.raise_for_status()
            data = resp.json()
            embedding: list[float] = data.get("embedding", [])
            if not embedding:
                raise EmbeddingUnavailableError("Embedding 模型返回空向量")
            return embedding
    except httpx.HTTPError as exc:
        logger.error(f"Embedding 调用失败: {exc}")
        raise EmbeddingUnavailableError(f"Embedding 模型不可用: {exc}")
