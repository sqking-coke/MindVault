from fastapi import Depends, HTTPException, Request
from sqlalchemy.ext.asyncio import AsyncSession
from app.config import settings
from app.core.database import get_db


async def verify_api_key(request: Request) -> None:
    """P1：Bearer Token 鉴权。API_KEY 为空或默认值时放行。"""
    if not settings.API_KEY or settings.API_KEY == "change-me-in-production":
        return
    auth = request.headers.get("Authorization", "")
    token = auth.removeprefix("Bearer ").strip()
    if not token or token != settings.API_KEY:
        raise HTTPException(status_code=401, detail="Invalid or missing API key")
