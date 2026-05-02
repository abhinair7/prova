"""
Cross-Encoder Reranking

First-stage retrieval optimises for recall (BM25 + dense).
The cross-encoder reads (query, passage) jointly — no approximation —
and is far more accurate but O(n) against retrieved candidates, not corpus.

Model: cross-encoder/ms-marco-MiniLM-L-6-v2
  - MRR@10 = 0.434 on MS MARCO Dev (vs 0.184 for BM25 alone)
  - ~6ms per (query, passage) pair on CPU
  - Use cross-encoder/ms-marco-MiniLM-L-12-v2 for +2% MRR at 2x latency
"""

import logging
import asyncio
from app.schemas.models import RetrievedChunk
from app.config import settings

logger = logging.getLogger(__name__)


class CrossEncoderReranker:
    """
    Reranks retrieved chunks using a cross-encoder.
    Runs in a thread pool to avoid blocking the async event loop.
    """

    def __init__(
        self,
        model_name: str = settings.reranker_model,
        top_k: int = settings.reranker_top_k,
        device: str = settings.device,
    ) -> None:
        self.model_name = model_name
        self.top_k = top_k
        self.device = device
        self._model = None

    def _load(self) -> None:
        if self._model is not None:
            return
        try:
            from sentence_transformers import CrossEncoder
            self._model = CrossEncoder(self.model_name, device=self.device)
            logger.info("Cross-encoder loaded: %s", self.model_name)
        except Exception as exc:
            logger.error("Failed to load cross-encoder: %s", exc)
            raise

    async def rerank(self, query: str, chunks: list[RetrievedChunk]) -> list[RetrievedChunk]:
        if not chunks:
            return []

        try:
            self._load()
        except Exception:
            logger.warning("Cross-encoder unavailable — returning original ordering")
            return chunks[: self.top_k]

        pairs = [(query, c.chunk.content) for c in chunks]

        scores = await asyncio.get_event_loop().run_in_executor(
            None, self._score_pairs, pairs
        )

        ranked = sorted(
            zip(chunks, scores),
            key=lambda x: x[1],
            reverse=True,
        )

        return [
            c.model_copy(update={"rerank_score": float(score)})
            for c, score in ranked[: self.top_k]
        ]

    def _score_pairs(self, pairs: list[tuple[str, str]]) -> list[float]:
        return self._model.predict(pairs, batch_size=32, show_progress_bar=False).tolist()
