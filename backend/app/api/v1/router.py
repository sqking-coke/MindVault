from fastapi import APIRouter, Depends
from app.api.v1.health import router as health_router
from app.api.v1.documents import router as documents_router
from app.api.v1.chat import router as chat_router
from app.api.v1.retrieval import router as retrieval_router
from app.api.v1.stats import router as stats_router
from app.api.v1.chunks import router as chunks_router
from app.api.deps import verify_api_key

api_router = APIRouter(prefix="/api/v1", dependencies=[Depends(verify_api_key)])
api_router.include_router(documents_router, prefix="/kb")
api_router.include_router(chat_router, prefix="/kb")
api_router.include_router(retrieval_router, prefix="/kb")
api_router.include_router(stats_router, prefix="/kb")
api_router.include_router(chunks_router, prefix="/kb")

# Health check — no auth required
public_router = APIRouter(prefix="/api/v1")
public_router.include_router(health_router)
