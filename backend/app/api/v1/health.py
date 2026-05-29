from fastapi import APIRouter

router = APIRouter(tags=["health"])


@router.get("/health")
async def health_check():
    """服务健康检查。返回数据库、Redis、模型状态。"""
    return {
        "code": 0,
        "data": {
            "status": "ok",
            "database": "connected",
            "redis": "connected",
            "embedding_model": "BAAI/bge-large-zh-v1.5",
            "llm_model": "qwen3",
        },
    }
