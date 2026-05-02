"""Evaluation API — receives documents/queries, runs the full RAG pipeline."""

import logging
from fastapi import APIRouter, UploadFile, File, Form, HTTPException, Depends, Request
from fastapi.responses import StreamingResponse
from app.schemas.models import EvaluationRequest, EvaluationResponse, VoteRequest, Vertical

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/evaluate", tags=["Evaluation"])


def get_pipeline(request: Request):
    return request.app.state.pipeline


@router.post("", response_model=EvaluationResponse)
async def run_evaluation(
    payload: EvaluationRequest,
    pipeline=Depends(get_pipeline),
) -> EvaluationResponse:
    """
    Full evaluation pipeline: PII masking → RAG retrieval → parallel LLM generation
    → hallucination detection → scoring.
    """
    try:
        return await pipeline.evaluate(payload)
    except Exception as exc:
        logger.error("Evaluation failed: %s", exc, exc_info=True)
        raise HTTPException(status_code=500, detail=str(exc))


@router.post("/upload")
async def evaluate_upload(
    file: UploadFile = File(...),
    query: str = Form(...),
    vertical: Vertical = Form(...),
    mask_pii: bool = Form(True),
    pipeline=Depends(get_pipeline),
) -> EvaluationResponse:
    """Upload a document (PDF/DOCX/CSV/TXT) and run evaluation against it."""
    if file.size and file.size > 10 * 1024 * 1024:
        raise HTTPException(status_code=413, detail="File exceeds 10MB limit")

    content = await file.read()
    from app.pipeline.loaders import DocumentLoader
    loader = DocumentLoader()
    docs = loader.load_bytes(content, file.filename or "upload")
    doc_texts = [d.content for d in docs]

    request = EvaluationRequest(
        query=query,
        vertical=vertical,
        documents=doc_texts,
        mask_pii=mask_pii,
    )
    return await pipeline.evaluate(request)


@router.post("/vote")
async def record_vote(vote: VoteRequest, request: Request) -> dict:
    """Record a professional vote on which model output was best."""
    store = request.app.state.feedback_store
    store.record(
        vote=vote,
        query="",
        context="",
        model_outputs={},
        model_scores={},
    )
    return {"status": "ok", "message": "Vote recorded. Thank you for improving the benchmark."}
