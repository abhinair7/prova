"""
MetaEvaluator — runs every registered benchmark against a model in parallel,
pulls Prova platform telemetry (professional votes, real-work evaluations),
and feeds both into the Prova Composite Index.

This is the single entry point that produces the headline number Prova
publishes: a model's overall PCI plus per-vertical PCI, with full breakdown.
"""

from __future__ import annotations
import asyncio
import logging
import statistics
from dataclasses import asdict, dataclass, field
from typing import Optional
from app.benchmarks.base import BenchmarkResult
from app.benchmarks.composite import PCIBreakdown, ProvaSignals, compute_pci
from app.benchmarks.registry import all_adapters, get_adapter, list_benchmarks

logger = logging.getLogger(__name__)


@dataclass
class MetaEvaluationReport:
    model_id: str
    benchmark_results: list[BenchmarkResult]
    overall_pci: PCIBreakdown
    per_vertical_pci: dict[str, PCIBreakdown]
    catalog: list[dict] = field(default_factory=list)

    def to_dict(self) -> dict:
        return {
            "model_id": self.model_id,
            "benchmark_results": [
                {**asdict(r), "dimension": r.dimension.value} for r in self.benchmark_results
            ],
            "overall_pci": _pci_to_dict(self.overall_pci),
            "per_vertical_pci": {v: _pci_to_dict(p) for v, p in self.per_vertical_pci.items()},
            "catalog": self.catalog,
        }


def _pci_to_dict(p: PCIBreakdown) -> dict:
    d = asdict(p)
    d["dimension_scores"] = {k.value: v for k, v in p.dimension_scores.items()}
    d["weights_used"] = {k.value: v for k, v in p.weights_used.items()}
    return d


class MetaEvaluator:
    """Runs every adapter against a model and produces a unified PCI report."""

    DEFAULT_VERTICALS = ("healthcare", "legal", "finance", "engineering", "research", "marketing", "accounting", "hr")

    async def evaluate_model(
        self,
        model_id: str,
        sample_size: int = 50,
        seed: Optional[int] = 42,
        benchmark_ids: Optional[list[str]] = None,
        signals: Optional[ProvaSignals] = None,
        verticals: Optional[list[str]] = None,
        max_concurrency: int = 4,
    ) -> MetaEvaluationReport:
        adapters = (
            [get_adapter(b) for b in benchmark_ids] if benchmark_ids else all_adapters()
        )
        sem = asyncio.Semaphore(max_concurrency)

        async def run(adapter):
            async with sem:
                logger.info("Evaluating %s on %s", model_id, adapter.benchmark_id)
                return await adapter.evaluate(model_id, sample_size=sample_size, seed=seed)

        results = await asyncio.gather(*(run(a) for a in adapters), return_exceptions=True)
        clean: list[BenchmarkResult] = [r for r in results if isinstance(r, BenchmarkResult)]
        for r in results:
            if isinstance(r, Exception):
                logger.warning("Benchmark failed for %s: %s", model_id, r)

        # Compute variance across normalized scores → feeds rigor signal.
        if signals is None:
            signals = ProvaSignals()
        if len(clean) >= 2:
            signals.score_stddev = statistics.stdev(r.score for r in clean)

        overall = compute_pci(clean, signals)
        verticals = verticals or list(self.DEFAULT_VERTICALS)
        per_vertical = {v: compute_pci(clean, signals, vertical=v) for v in verticals}

        return MetaEvaluationReport(
            model_id=model_id,
            benchmark_results=clean,
            overall_pci=overall,
            per_vertical_pci=per_vertical,
            catalog=list_benchmarks(),
        )

    async def evaluate_models(
        self,
        model_ids: list[str],
        **kwargs,
    ) -> dict[str, MetaEvaluationReport]:
        """Evaluate multiple models in parallel and return a model_id → report map."""
        reports = await asyncio.gather(
            *(self.evaluate_model(m, **kwargs) for m in model_ids),
            return_exceptions=True,
        )
        return {
            m: r for m, r in zip(model_ids, reports)
            if isinstance(r, MetaEvaluationReport)
        }
