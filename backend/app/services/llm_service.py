import json
from collections.abc import AsyncGenerator

from loguru import logger

import httpx

from app.config import settings
from app.core.exceptions import LLMCallFailedError


async def generate_stream(
    system_prompt: str,
    user_prompt: str,
) -> AsyncGenerator[str, None]:
    """调用 Ollama Chat API 流式生成，逐 token yield 文本。"""
    url = f"{settings.LLM_BASE_URL.rstrip('/')}/api/chat"
    payload = {
        "model": settings.LLM_MODEL,
        "messages": [
            {"role": "system", "content": system_prompt},
            {"role": "user", "content": user_prompt},
        ],
        "stream": True,
        "options": {"temperature": 0.3},
    }

    try:
        async with httpx.AsyncClient(timeout=120.0) as client:
            async with client.stream("POST", url, json=payload) as resp:
                resp.raise_for_status()
                async for line in resp.aiter_lines():
                    if not line:
                        continue
                    try:
                        chunk = json.loads(line)
                    except Exception:
                        continue
                    if chunk.get("done"):
                        return
                    content = chunk.get("message", {}).get("content", "")
                    if content:
                        yield content
    except httpx.HTTPError as exc:
        logger.error(f"LLM 调用失败: {exc}")
        raise LLMCallFailedError(f"LLM 调用失败: {exc}")
