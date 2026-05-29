from typing import Generic, Optional, TypeVar
from pydantic import BaseModel

T = TypeVar("T")


class ApiResponse(BaseModel, Generic[T]):
    code: int = 0
    data: Optional[T] = None


class ApiError(BaseModel):
    code: int
    message: str


class PaginatedData(BaseModel, Generic[T]):
    items: list[T]
    total: int
    page: int
    page_size: int


def success_response(data: T) -> dict:
    """快捷构造统一成功响应。"""
    return {"code": 0, "data": data}


def error_response(code: int, message: str) -> dict:
    """快捷构造统一错误响应。"""
    return {"code": code, "message": message}
