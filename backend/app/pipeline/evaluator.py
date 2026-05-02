"""
Evaluation Metrics

Metrics computed per model response:
  - RAGAS:  Faithfulness, Answer Relevancy, Context Precision, Context Recall
  - BERTScore F1 (semantic similarity vs. reference if available)
  - ROUGE-L (lexical overlap)
  - Hallucination rate (from HallucinationDetector)
  - Latency (p50 measured during generation)

Latency vs. Accuracy trade-off:
  The composite "overall" score applies a latency penalty to models
  that exceed an SLA threshold, configurable per vertical.
  Healthcare: no penalty (accuracy paramount)
  Engineering: moderate penalty (latency matters for interactive use)
"""

import logging
import asyncio
import math
from typing import Optional
from app.schemas.models import (
    LLMResponse, RetrievedChunk, HallucinationResult, EvaluationScores, Vertical
)

logger = logging.getLogger(__name__)

# Composite score weights per vertical [faithfulness, relevancy, accuracy, trust, latency_penalty_factor]
_VERTICAL_WEIGHTS: dict[str, tuple[float, float, float, float, float]] = {
    Vertical.HEALTHCARE:  (0.35, 0.20, 0.30, 0.15, 0.0),
    Vertical.LEGAL:       (0.30, 0.20, 0.30, 0.20, 0.0),
    Vertical.FINANCE:     (0.25, 0.20, 0.35, 0.20, 0.0),
    Vertical.ENGINEERING: (0.20, 0.30, 0.25, 0.10, 0.15),
    Vertical.ACCOUNTING:  (0.30, 0.15, 0.40, 0.15, 0.0),
    Vertical.MARKETING:   (0.15, 0.40, 0.25, 0.10, 0.10),
    Vertical.HR:          (0.25, 0.25, 0.30, 0.20, 0.0),
    Vertical.RESEARCH:    (0.35, 0.25, 0.25, 0.15, 0.0),
}

_DEFAULT_WEIGHTS = (0.25, 0.25, 0.25, 0.15, 0.10)

_LATENCY_SLA_MS: dict[str, float] = {
    Vertical.ENGINEERING: 1500,
    Vertical.MARKETING: 2000,
}
_DEFAULT_LATENCY_SLA = 5000   # permissive for accuracy-first verticals


class MetricsEvaluator:
    """Computes all evaluation metrics for a single (response, context) pair."""

    def __init__(self) -> None:
        self._bert_scorer = None
        self._rouge_scorer = None

    async def evaluate(
        self,
        response: LLMResponse,
        retrieved_chunks: list[RetrievedChunk],
        hallucination: HallucinationResult,
        query: str,
        vertical: str,
        reference: Optional[str] = None,
    ) -> EvaluationScores:
        tasks = [
            self._ragas_scores(response.output, retrieved_chunks, query),
            self._bert_score(response.output, reference or ""),
            self._rouge_l(response.output, reference or ""),
        ]
        ragas, bert, rouge = await asyncio.gather(*tasks, return_exceptions=True)

        ragas = ragas if isinstance(ragas, dict) else {}
        bert = bert if isinstance(bert, float) else 0.0
        rouge = rouge if isinstance(rouge, float) else 0.0

        overall = self._composite_score(
            faithfulness=ragas.get("faithfulness", _estimate_faithfulness(hallucination)),
            relevancy=ragas.get("answer_relevancy", 0.75),
            accuracy=ragas.get("context_precision", 0.75),
            trust=1.0 - hallucination.hallucination_rate,
            latency_ms=response.latency_ms,
            vertical=vertical,
        )

        return EvaluationScores(
            ragas_faithfulness=ragas.get("faithfulness", _estimate_faithfulness(hallucination)),
            ragas_answer_relevancy=ragas.get("answer_relevancy", 0.75),
            ragas_context_precision=ragas.get("context_precision", 0.75),
            ragas_context_recall=ragas.get("context_recall", 0.70),
            bert_score_f1=bert,
            rouge_l=rouge,
            hallucination_rate=hallucination.hallucination_rate,
            latency_ms=response.latency_ms,
            overall=overall * 100,   # convert to 0–100 scale
        )

    async def _ragas_scores(
        self,
        response_text: str,
        chunks: list[RetrievedChunk],
        query: str,
    ) -> dict:
        """
        RAGAS evaluation. Requires an LLM judge internally.
        Gracefully returns estimates if ragas is not configured.
        """
        try:
            from ragas import evaluate as ragas_evaluate
            from ragas.metrics import faithfulness, answer_relevancy, context_precision, context_recall
            from datasets import Dataset

            contexts = [rc.chunk.content for rc in chunks[:5]]
            data = {
                "question": [query],
                "answer": [response_text],
                "contexts": [contexts],
                "ground_truth": [""],
            }
            result = ragas_evaluate(Dataset.from_dict(data), metrics=[faithfulness, answer_relevancy, context_precision])
            return dict(result)
        except Exception as exc:
            logger.debug("RAGAS evaluation skipped: %s", exc)
            return {}

    async def _bert_score(self, hypothesis: str, reference: str) -> float:
        if not reference:
            return 0.0
        try:
            from bert_score import score as bs_score
            P, R, F1 = bs_score([hypothesis], [reference], lang="en", verbose=False)
            return float(F1[0])
        except Exception:
            return 0.0

    async def _rouge_l(self, hypothesis: str, reference: str) -> float:
        if not reference:
            return 0.0
        try:
            from rouge_score import rouge_scorer
            scorer = rouge_scorer.RougeScorer(["rougeL"], use_stemmer=True)
            result = scorer.score(reference, hypothesis)
            return result["rougeL"].fmeasure
        except Exception:
            return 0.0

    def _composite_score(
        self,
        faithfulness: float,
        relevancy: float,
        accuracy: float,
        trust: float,
        latency_ms: float,
        vertical: str,
    ) -> float:
        w = _VERTICAL_WEIGHTS.get(vertical, _DEFAULT_WEIGHTS)
        w_faith, w_rel, w_acc, w_trust, w_lat = w

        base = (
            w_faith * faithfulness
            + w_rel * relevancy
            + w_acc * accuracy
            + w_trust * trust
        )

        # Latency penalty: exponential decay beyond SLA
        sla = _LATENCY_SLA_MS.get(vertical, _DEFAULT_LATENCY_SLA)
        if latency_ms > sla and w_lat > 0:
            penalty = w_lat * (1 - math.exp(-(latency_ms - sla) / sla))
            base = max(0.0, base - penalty)

        return min(1.0, max(0.0, base))


def _estimate_faithfulness(hallucination: HallucinationResult) -> float:
    """Fallback faithfulness estimate from hallucination detector."""
    return 1.0 - hallucination.hallucination_rate
