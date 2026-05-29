from fastapi import Depends, HTTPException, Header
from sqlalchemy.ext.asyncio import AsyncSession
from app.config import settings
from app.core.database import get_db


async def verify_api_key(x_api_key: str = Header(alias="Authorization")) -> str:
    """P1 启用：校验 API Key。当前放行所有请求。"""
    if settings.APP_ENV == "production":
        token = x_api_key.removeprefix("Bearer ").strip()
        if token != settings.API_KEY:
            raise HTTPException(status_code=401, detail="Unauthorized")
    return x_api_key
