"""
Prova API — FastAPI entry point

Run: uvicorn main:app --reload --host 0.0.0.0 --port 8000
"""

import logging
import structlog
from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.middleware.gzip import GZipMiddleware
from prometheus_client import make_asgi_app

from app.config import settings
from app.pipeline.orchestrator import PipelineOrchestrator
from app.pipeline.feedback import FeedbackStore
from app.models.distiller import DistillationPipeline
from app.routers import evaluate, benchmark, meta, pipeline as pipeline_router

# ── Logging setup ─────────────────────────────────────────────────────────────

structlog.configure(
    processors=[
        structlog.stdlib.filter_by_level,
        structlog.processors.TimeStamper(fmt="iso"),
        structlog.processors.JSONRenderer(),
    ],
    wrapper_class=structlog.stdlib.BoundLogger,
    logger_factory=structlog.stdlib.LoggerFactory(),
)

logging.basicConfig(level=getattr(logging, settings.log_level.upper(), logging.INFO))
logger = logging.getLogger(__name__)


# ── Lifespan ─────────────────────────────────────────────────────────────────

@asynccontextmanager
async def lifespan(app: FastAPI):
    logger.info("Starting Prova API (env=%s)", settings.environment)
    app.state.pipeline = PipelineOrchestrator()
    app.state.feedback_store = FeedbackStore()
    app.state.distiller = DistillationPipeline()
    app.state.settings = settings
    logger.info("All services initialised")
    yield
    logger.info("Shutting down Prova API")


# ── App factory ───────────────────────────────────────────────────────────────

app = FastAPI(
    title="Prova API",
    description="The trust and discovery layer for professional AI — RAG evaluation pipeline",
    version="0.1.0",
    docs_url="/docs",
    redoc_url="/redoc",
    lifespan=lifespan,
)

# Middleware
app.add_middleware(GZipMiddleware, minimum_size=1000)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "https://prova.ai"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Prometheus metrics endpoint
metrics_app = make_asgi_app()
app.mount("/metrics", metrics_app)

# Routers
app.include_router(evaluate.router, prefix="/api")
app.include_router(benchmark.router, prefix="/api")
app.include_router(meta.router, prefix="/api")
app.include_router(pipeline_router.router, prefix="/api")


@app.get("/")
async def root() -> dict:
    return {
        "name": "Prova API",
        "tagline": "Prova it. Prove it.",
        "docs": "/docs",
        "health": "/api/pipeline/health",
    }


@app.get("/health")
async def health() -> dict:
    return {"status": "ok"}
