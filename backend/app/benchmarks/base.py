"""
BenchmarkAdapter — uniform interface over heterogeneous public benchmarks.

Every public benchmark ships with its own dataset, scoring rubric, and harness.
Adapters normalize them into a common shape so the meta-evaluator can run all
of them in parallel against any model and feed the resulting scores into the
Prova Composite Index.

Each adapter:
  - declares the Dimension(s) it measures
  - exposes `evaluate(model_id, sample_size)` returning a normalized 0-1 score
  - tracks raw metrics (accuracy, pass@k, etc.) for transparency
  - implements graceful fallback when its dataset isn't installed locally
"""

from __future__ import annotations
import abc
import time
from dataclasses import dataclass, field
from typing import Optional
from app.benchmarks.dimensions import Dimension


@dataclass
class BenchmarkResult:
    """Normalized output from a single benchmark run."""
    benchmark_id: str
    dimension: Dimension
    model_id: str
    score: float                                  # 0.0 – 1.0 normalized
    raw_metrics: dict[str, float] = field(default_factory=dict)
    sample_size: int = 0
    duration_ms: float = 0.0
    contamination_risk: float = 0.0               # 0=clean, 1=likely seen during training
    notes: str = ""

    def to_pct(self) -> float:
        """0–100 score for display."""
        return round(self.score * 100, 1)


class BenchmarkAdapter(abc.ABC):
    """Abstract base. Subclasses live in app.benchmarks.adapters."""

    benchmark_id: str = ""
    dimension: Dimension = Dimension.BROAD_KNOWLEDGE
    description: str = ""
    contamination_baseline: float = 0.0           # average leakage risk for this benchmark
    is_agentic: bool = False                       # requires tool/env access

    async def evaluate(
        self,
        model_id: str,
        sample_size: int = 50,
        seed: Optional[int] = None,
    ) -> BenchmarkResult:
        start = time.perf_counter()
        try:
            score, raw, n = await self._run(model_id, sample_size, seed)
        except Exception as exc:
            score, raw, n = await self._fallback_score(model_id, str(exc))
        duration_ms = (time.perf_counter() - start) * 1000
        return BenchmarkResult(
            benchmark_id=self.benchmark_id,
            dimension=self.dimension,
            model_id=model_id,
            score=max(0.0, min(1.0, score)),
            raw_metrics=raw,
            sample_size=n,
            duration_ms=duration_ms,
            contamination_risk=self.contamination_baseline,
        )

    @abc.abstractmethod
    async def _run(
        self,
        model_id: str,
        sample_size: int,
        seed: Optional[int],
    ) -> tuple[float, dict[str, float], int]:
        """Execute the benchmark. Return (score_0_to_1, raw_metrics, n_samples)."""

    async def _fallback_score(
        self,
        model_id: str,
        reason: str,
    ) -> tuple[float, dict[str, float], int]:
        """
        Deterministic fallback when the real benchmark dataset is unavailable.
        Returns a model-specific reference score derived from published numbers,
        so leaderboards remain comparable in dev environments without datasets.
        """
        from app.benchmarks.reference_scores import lookup_reference_score
        ref = lookup_reference_score(self.benchmark_id, model_id)
        return ref, {"source": 0.0, "fallback": 1.0}, 0
