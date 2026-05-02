"""Pipeline introspection API — health, cache stats, distillation data."""

import logging
from fastapi import APIRouter, Request
from app.pipeline.cache_manager import RetrievalCacheManager

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/pipeline", tags=["Pipeline"])


@router.get("/health")
async def health(request: Request) -> dict:
    """Full pipeline health check."""
    pipeline = request.app.state.pipeline
    cache: RetrievalCacheManager = pipeline._cache
    return {
        "status": "ok",
        "vector_store": {
            "backend": request.app.state.settings.vector_store_backend,
            "chunk_count": pipeline._vector_store.count(),
        },
        "cache": {
            "l1_size": cache.l1_size,
            "backend": request.app.state.settings.cache_backend,
        },
        "embedding_model": request.app.state.settings.embedding_model,
        "reranker_model": request.app.state.settings.reranker_model,
        "device": request.app.state.settings.device,
    }


@router.delete("/cache/{vertical}")
async def purge_cache(vertical: str, request: Request) -> dict:
    """Purge cached retrieval results for a vertical (e.g., after benchmark rotation)."""
    pipeline = request.app.state.pipeline
    count = pipeline._cache.purge_vertical(vertical)
    return {"status": "ok", "purged_entries": count, "vertical": vertical}


@router.get("/fine-tune-dataset/{vertical}")
async def get_fine_tune_dataset(vertical: str, request: Request) -> dict:
    """Return DPO preference pairs for fine-tuning smaller models."""
    store = request.app.state.feedback_store
    pairs = store.get_fine_tune_dataset(vertical)
    return {"vertical": vertical, "pair_count": len(pairs), "pairs": pairs[:100]}


@router.get("/distillation-stats")
async def distillation_stats(request: Request) -> dict:
    """Return counts of collected distillation pairs per vertical."""
    distiller = getattr(request.app.state, "distiller", None)
    if not distiller:
        return {"stats": {}}
    return {"stats": distiller.get_dataset_stats()}
