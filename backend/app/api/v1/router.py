from fastapi import APIRouter
from app.api.v1.health import router as health_router
from app.api.v1.documents import router as documents_router
from app.api.v1.chat import router as chat_router
from app.api.v1.retrieval import router as retrieval_router

api_router = APIRouter(prefix="/api/v1")
api_router.include_router(health_router)
api_router.include_router(documents_router, prefix="/kb")
api_router.include_router(chat_router, prefix="/kb")
api_router.include_router(retrieval_router, prefix="/kb")
