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
    """调用 LLM 流式生成，兼容 Ollama 原生 & OpenAI 兼容 API."""
    if settings.LLM_PROVIDER == "openai":
        async for token in _generate_openai(system_prompt, user_prompt):
            yield token
    else:
        async for token in _generate_ollama(system_prompt, user_prompt):
            yield token


async def _generate_ollama(
    system_prompt: str,
    user_prompt: str,
) -> AsyncGenerator[str, None]:
    """Ollama 原生 Chat API (POST /api/chat, NDJSON stream)."""
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
        logger.error(f"LLM (ollama) 调用失败: {exc}")
        raise LLMCallFailedError(f"LLM 调用失败: {exc}")


async def _generate_openai(
    system_prompt: str,
    user_prompt: str,
) -> AsyncGenerator[str, None]:
    """OpenAI 兼容 Chat Completions API (POST /chat/completions, SSE stream).

    支持 OpenAI / DeepSeek / 通义千问 / 本地 vLLM 等兼容接口。
    使用 LLM_BASE_URL（通常以 /v1 结尾）。
    """
    base = settings.LLM_BASE_URL.rstrip('/')
    # 如果 URL 已经以 /v1 结尾则直接拼，否则加 /v1
    url = f"{base}/chat/completions" if base.endswith("/v1") else f"{base}/v1/chat/completions"

    headers = {"Content-Type": "application/json"}
    if settings.LLM_API_KEY:
        headers["Authorization"] = f"Bearer {settings.LLM_API_KEY}"

    payload = {
        "model": settings.LLM_MODEL,
        "messages": [
            {"role": "system", "content": system_prompt},
            {"role": "user", "content": user_prompt},
        ],
        "stream": True,
        "temperature": 0.3,
    }

    try:
        async with httpx.AsyncClient(timeout=120.0) as client:
            async with client.stream("POST", url, headers=headers, json=payload) as resp:
                resp.raise_for_status()
                async for line in resp.aiter_lines():
                    if not line or not line.startswith("data: "):
                        continue
                    data_str = line[6:]  # strip "data: "
                    if data_str == "[DONE]":
                        return
                    try:
                        chunk = json.loads(data_str)
                        delta = chunk.get("choices", [{}])[0].get("delta", {})
                        content = delta.get("content", "")
                        if content:
                            yield content
                    except (json.JSONDecodeError, KeyError, IndexError):
                        continue
    except httpx.HTTPError as exc:
        logger.error(f"LLM (openai) 调用失败: {exc}")
        raise LLMCallFailedError(f"LLM 调用失败: {exc}")
