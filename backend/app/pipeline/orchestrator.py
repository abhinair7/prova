"""
Pipeline Orchestrator

Single entry point that coordinates all pipeline stages
for a complete evaluation request.

Stage execution order:
  load -> preprocess -> mask_pii -> chunk -> embed ->
  index -> reformulate_query -> retrieve -> rerank ->
  run_models (parallel) -> detect_hallucinations (parallel) ->
  score -> check_bias -> cache_results
"""

import hashlib
import logging
import asyncio
import time
from typing import Optional

from app.schemas.models import (
    EvaluationRequest, EvaluationResponse, ModelEvalResult,
    RetrievedChunk,
)
from app.pipeline.loaders import DocumentLoader
from app.pipeline.preprocessor import Preprocessor
from app.pipeline.pii_masker import PIIMasker
from app.pipeline.chunker import SemanticChunker
from app.pipeline.embedder import Embedder
from app.pipeline.vector_store import create_vector_store
from app.pipeline.query_reformulator import QueryReformulator
from app.pipeline.retriever import HybridRetriever, MultiHopRetriever
from app.pipeline.reranker import CrossEncoderReranker
from app.pipeline.hallucination import HallucinationDetector
from app.pipeline.evaluator import MetricsEvaluator
from app.pipeline.cache_manager import RetrievalCacheManager
from app.pipeline.bias_checker import BiasChecker
from app.models.runner import ModelRunner
from app.config import settings

logger = logging.getLogger(__name__)


class PipelineOrchestrator:
    """
    Singleton orchestrator. Initialise once at startup; call evaluate() per request.
    """

    def __init__(self) -> None:
        logger.info("Initialising Prova RAG pipeline...")
        self._embedder = Embedder()
        self._vector_store = create_vector_store(dimension=settings.embedding_dim)
        self._chunker = SemanticChunker()
        self._retriever = HybridRetriever(vector_store=self._vector_store)
        self._multi_hop = MultiHopRetriever(base_retriever=self._retriever)
        self._reranker = CrossEncoderReranker()
        self._runner = ModelRunner()
        self._hallucination_detector = HallucinationDetector(device=settings.device)
        self._evaluator = MetricsEvaluator()
        self._cache = RetrievalCacheManager()
        self._reformulator = QueryReformulator()
        self._bias_checker = BiasChecker()
        self._loader = DocumentLoader()
        logger.info("Pipeline ready")

    async def evaluate(self, request: EvaluationRequest) -> EvaluationResponse:
        start = time.perf_counter()

        # 1. Load documents
        raw_docs = []
        if request.documents:
            for doc_text in request.documents:
                raw_docs.extend(self._loader.load_text(doc_text))

        # 2. Preprocess
        preprocessor = Preprocessor()
        if raw_docs:
            raw_docs = preprocessor.process(raw_docs)

        # 3. PII masking
        pii_masker = PIIMasker()
        total_pii_removed = 0

        if request.mask_pii:
            masked_docs = []
            for doc in raw_docs:
                masked_doc, pii_result = pii_masker.mask_document(doc)
                masked_docs.append(masked_doc)
                total_pii_removed += pii_result.mask_count
            raw_docs = masked_docs
            masked_query, q_pii = pii_masker.mask_text(request.query)
            total_pii_removed += q_pii.mask_count
        else:
            masked_query = request.query

        # 4. Chunk + embed + index (only if new documents)
        if raw_docs:
            chunks = self._chunker.chunk_documents(raw_docs)
            chunks = self._embedder.embed_documents(chunks)
            for c in chunks:
                c.metadata["vertical"] = request.vertical
            self._vector_store.add_chunks(chunks)
            self._retriever.index_chunks(chunks)

        # 5. Query reformulation
        reformulation = await self._reformulator.reformulate(
            masked_query, vertical=request.vertical
        )

        # 6. Retrieval (check cache first)
        cached = self._cache.get_retrieval(masked_query, request.vertical, settings.retrieval_top_k)
        if cached:
            retrieved = [RetrievedChunk(**r) for r in cached]
        else:
            if len(reformulation.sub_queries) >= 2:
                retrieved = await self._multi_hop.retrieve(
                    reformulation, self._embedder, vertical=request.vertical
                )
            else:
                retrieved = await self._retriever.retrieve(
                    reformulation, self._embedder, vertical=request.vertical,
                    user_id=request.user_id
                )
            self._cache.set_retrieval(masked_query, request.vertical, settings.retrieval_top_k, retrieved)

        # 7. Rerank
        reranked = await self._reranker.rerank(masked_query, retrieved)

        # 8. Generate responses (all models in parallel)
        llm_responses = await self._runner.run_all(
            query=masked_query,
            retrieved_chunks=reranked,
            vertical=request.vertical,
            models=request.models,
        )

        # 9. Hallucination detection + evaluation (parallel per model)
        eval_tasks = [
            self._evaluate_single_response(resp, reranked, masked_query, request.vertical)
            for resp in llm_responses
        ]
        model_results: list[ModelEvalResult] = await asyncio.gather(*eval_tasks)  # type: ignore

        # 10. Sort by overall score
        model_results.sort(key=lambda r: r.scores.overall, reverse=True)
        best_model = model_results[0].model if model_results else "unknown"

        total_ms = (time.perf_counter() - start) * 1000
        logger.info(
            "Evaluation complete in %.0fms | vertical=%s | best=%s | models=%d",
            total_ms, request.vertical, best_model, len(model_results)
        )

        return EvaluationResponse(
            vertical=request.vertical,
            query_reformulation=reformulation,
            results=model_results,
            best_model=best_model,
            total_latency_ms=total_ms,
            pii_entities_removed=total_pii_removed,
        )

    async def _evaluate_single_response(self, response, retrieved, query, vertical):
        hallucination = await self._hallucination_detector.detect(response.output, retrieved, query)
        scores = await self._evaluator.evaluate(
            response=response,
            retrieved_chunks=retrieved,
            hallucination=hallucination,
            query=query,
            vertical=vertical,
        )
        bias = self._bias_checker.check(response.output)
        if bias.has_bias:
            logger.info("Bias flags for %s: %s", response.model, bias.flags)
        return ModelEvalResult(
            model=response.model,
            provider=response.provider,
            vertical=vertical,
            response=response,
            retrieved_chunks=retrieved,
            hallucination=hallucination,
            scores=scores,
            pii_masked=True,
        )

    def context_hash(self, chunks: list[RetrievedChunk]) -> str:
        combined = "".join(c.chunk.content for c in chunks[:5])
        return hashlib.md5(combined.encode()).hexdigest()[:16]
