"""
Prova Composite Index (PCI)

The PCI fuses all 11 public-benchmark scores plus three Prova-exclusive
signals into a single 0–100 number that better predicts production readiness
than any individual benchmark.

Three Prova-exclusive layers:

  1. PROFESSIONAL_VERIFIED — Wilson lower-bound on win-rate vs other models,
     using votes cast by verified domain professionals on Prova.

  2. REAL_WORK_GENERALIZATION — average evaluator score on user-uploaded
     real artifacts (cases, contracts, code, reports) routed through the
     Prova RAG pipeline. This is the dimension all public benchmarks miss.

  3. STATISTICAL_RIGOR — combines (a) the contamination-adjusted reliability
     of the public-benchmark portion and (b) the width of the 95% confidence
     interval on the score itself (narrower = more rigorous).

A model that scores 95 on MMLU but has zero professional votes and a wide CI
will score lower on the PCI than a model with slightly worse benchmark numbers
but high real-work performance. That's the design — it inverts the gameable-
benchmark dynamic.
"""

from __future__ import annotations
import logging
import math
from dataclasses import dataclass, field
from typing import Optional
from app.benchmarks.base import BenchmarkResult
from app.benchmarks.dimensions import (
    Dimension, DEFAULT_PCI_WEIGHTS, VERTICAL_DIMENSION_BIAS,
)

logger = logging.getLogger(__name__)


@dataclass
class ProvaSignals:
    """The Prova-exclusive layers — populated from the platform's own data, not public benchmarks."""
    professional_win_rate: float = 0.5            # head-to-head win rate over all professional votes
    professional_vote_count: int = 0              # for Wilson bound — more votes = tighter
    real_work_score: float = 0.0                  # mean evaluator score on uploaded artifacts (0-1)
    real_work_evaluations: int = 0                # n
    score_stddev: float = 0.0                     # variance across benchmark runs
    contamination_adjustment: float = 1.0         # downweighting factor from leakage analysis


@dataclass
class PCIBreakdown:
    """Full transparency into how the composite score was assembled."""
    pci: float                                    # 0-100
    pci_lower_95: float                           # Wilson lower bound at 95%
    pci_upper_95: float
    dimension_scores: dict[Dimension, float] = field(default_factory=dict)  # 0-1
    weights_used: dict[Dimension, float] = field(default_factory=dict)
    contamination_penalty: float = 0.0
    rigor_score: float = 0.0
    professional_layer_contribution: float = 0.0
    public_benchmark_contribution: float = 0.0
    real_work_contribution: float = 0.0
    notes: list[str] = field(default_factory=list)


def compute_pci(
    benchmark_results: list[BenchmarkResult],
    signals: ProvaSignals,
    vertical: Optional[str] = None,
) -> PCIBreakdown:
    """
    Compute the Prova Composite Index.

    benchmark_results: outputs from every adapter that was run.
    signals: Prova platform telemetry (professional votes, real-work runs).
    vertical: if provided, applies vertical-specific dimension reweighting.
    """
    # 1. Public-benchmark dimensions: average within-dimension across adapters
    dim_scores: dict[Dimension, float] = {}
    for r in benchmark_results:
        dim_scores.setdefault(r.dimension, []).append(_contamination_adjust(r))
    dim_scores = {d: sum(v) / len(v) for d, v in dim_scores.items() if v}

    # 2. Prova-exclusive dimensions
    dim_scores[Dimension.PROFESSIONAL_VERIFIED] = _wilson_lower_bound(
        signals.professional_win_rate, signals.professional_vote_count, z=1.96,
    )
    dim_scores[Dimension.REAL_WORK_GENERALIZATION] = signals.real_work_score
    dim_scores[Dimension.STATISTICAL_RIGOR] = _rigor_score(benchmark_results, signals)

    # 3. Apply vertical reweighting
    weights = _reweight_for_vertical(DEFAULT_PCI_WEIGHTS, vertical)

    # 4. Weighted aggregate
    total_weight = sum(weights[d] for d in dim_scores if d in weights)
    if total_weight == 0:
        pci_unit = 0.0
    else:
        pci_unit = sum(dim_scores[d] * weights[d] for d in dim_scores if d in weights) / total_weight

    # 5. Confidence interval
    n_total = signals.professional_vote_count + signals.real_work_evaluations + sum(r.sample_size for r in benchmark_results)
    ci_lo, ci_hi = _wilson_interval(pci_unit, n_total) if n_total else (pci_unit, pci_unit)

    # 6. Contributions for transparency
    public_contrib = sum(
        dim_scores.get(d, 0) * weights[d]
        for d in dim_scores
        if d in weights and d not in (Dimension.PROFESSIONAL_VERIFIED, Dimension.REAL_WORK_GENERALIZATION, Dimension.STATISTICAL_RIGOR)
    )
    prof_contrib = dim_scores.get(Dimension.PROFESSIONAL_VERIFIED, 0) * weights.get(Dimension.PROFESSIONAL_VERIFIED, 0)
    real_contrib = dim_scores.get(Dimension.REAL_WORK_GENERALIZATION, 0) * weights.get(Dimension.REAL_WORK_GENERALIZATION, 0)

    notes: list[str] = []
    if signals.professional_vote_count < 50:
        notes.append("Insufficient professional votes (<50) — PCI marked provisional.")
    if signals.real_work_evaluations < 25:
        notes.append("Real-work sample thin — generalization estimate has wide CI.")
    contamination_penalty = 1.0 - sum(r.contamination_risk for r in benchmark_results) / max(len(benchmark_results), 1)

    return PCIBreakdown(
        pci=round(pci_unit * 100, 1),
        pci_lower_95=round(ci_lo * 100, 1),
        pci_upper_95=round(ci_hi * 100, 1),
        dimension_scores={d: round(v, 4) for d, v in dim_scores.items()},
        weights_used=weights,
        contamination_penalty=round(contamination_penalty, 3),
        rigor_score=round(dim_scores[Dimension.STATISTICAL_RIGOR], 3),
        professional_layer_contribution=round(prof_contrib * 100, 1),
        public_benchmark_contribution=round(public_contrib * 100, 1),
        real_work_contribution=round(real_contrib * 100, 1),
        notes=notes,
    )


def _contamination_adjust(r: BenchmarkResult) -> float:
    """De-rate raw score by half the contamination risk — leaked benchmarks lie."""
    return r.score * (1.0 - 0.5 * r.contamination_risk)


def _wilson_lower_bound(p: float, n: int, z: float = 1.96) -> float:
    """Wilson lower bound — robust under small n, key for low-vote-count models."""
    if n == 0:
        return 0.0
    denom = 1 + z * z / n
    centre = p + z * z / (2 * n)
    margin = z * math.sqrt((p * (1 - p) + z * z / (4 * n)) / n)
    return max(0.0, (centre - margin) / denom)


def _wilson_interval(p: float, n: int, z: float = 1.96) -> tuple[float, float]:
    if n == 0:
        return p, p
    denom = 1 + z * z / n
    centre = p + z * z / (2 * n)
    margin = z * math.sqrt((p * (1 - p) + z * z / (4 * n)) / n)
    return max(0.0, (centre - margin) / denom), min(1.0, (centre + margin) / denom)


def _rigor_score(results: list[BenchmarkResult], signals: ProvaSignals) -> float:
    """
    Statistical-rigor signal:
      - Lower contamination = higher rigor
      - Higher coverage (more dimensions tested) = higher rigor
      - Lower score variance = higher rigor (consistent performance)
    """
    if not results:
        return 0.5
    avg_contam = sum(r.contamination_risk for r in results) / len(results)
    coverage = len({r.dimension for r in results}) / 11   # public dimensions covered
    variance_pen = max(0.0, 1.0 - signals.score_stddev * 2)
    return max(0.0, min(1.0, 0.5 * (1 - avg_contam) + 0.3 * coverage + 0.2 * variance_pen))


def _reweight_for_vertical(base: dict[Dimension, float], vertical: Optional[str]) -> dict[Dimension, float]:
    if not vertical:
        return dict(base)
    bias = VERTICAL_DIMENSION_BIAS.get(vertical, {})
    out = {d: w * bias.get(d, 1.0) for d, w in base.items()}
    total = sum(out.values())
    return {d: w / total for d, w in out.items()} if total else out
