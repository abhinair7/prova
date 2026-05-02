"""
Meta-evaluation API — exposes the unified benchmark stack:
  GET  /api/meta/catalog                 list all 11 benchmarks + dimensions
  POST /api/meta/evaluate                run all benchmarks against one model
  POST /api/meta/compare                 evaluate multiple models, return PCI deltas
  GET  /api/meta/why-prova               return the framing of why PCI > any single benchmark

The PCI returned here subsumes ARC AGI 2, MMLU, GSM 8K, HumanEval, SWE-Bench,
TruthfulQA, GPQA Diamond, Terminal Bench 2, Humanity's Last Exam, Browser Call,
and MCP Atlas — and adds the professional-verified, real-work, and statistical-
rigor layers that no public benchmark covers.
"""

from __future__ import annotations
import logging
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel, Field
from app.benchmarks import ProvaSignals
from app.benchmarks.registry import list_benchmarks
from app.benchmarks.meta_evaluator import MetaEvaluator

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/meta", tags=["Meta"])

_evaluator = MetaEvaluator()


class SignalsPayload(BaseModel):
    professional_win_rate: float = 0.5
    professional_vote_count: int = 0
    real_work_score: float = 0.0
    real_work_evaluations: int = 0


class EvaluateRequest(BaseModel):
    model_id: str
    sample_size: int = Field(50, ge=1, le=500)
    seed: int | None = 42
    benchmark_ids: list[str] | None = None
    verticals: list[str] | None = None
    signals: SignalsPayload | None = None


class CompareRequest(BaseModel):
    model_ids: list[str] = Field(..., min_length=2, max_length=10)
    sample_size: int = Field(50, ge=1, le=500)
    seed: int | None = 42
    vertical: str | None = None
    signals_by_model: dict[str, SignalsPayload] | None = None


@router.get("/catalog")
async def get_catalog() -> dict:
    """Enumerate every benchmark in the meta-stack with its capability dimension."""
    return {
        "benchmarks": list_benchmarks(),
        "total": len(list_benchmarks()),
        "framing": (
            "Prova subsumes the public-benchmark stack and adds three layers no public "
            "benchmark covers: professional verification, real-work generalization, and "
            "statistical rigor (Wilson CIs + contamination adjustment)."
        ),
    }


@router.post("/evaluate")
async def evaluate(req: EvaluateRequest) -> dict:
    """Run all selected benchmarks + compute the Prova Composite Index."""
    signals = ProvaSignals(**req.signals.model_dump()) if req.signals else ProvaSignals()
    try:
        report = await _evaluator.evaluate_model(
            model_id=req.model_id,
            sample_size=req.sample_size,
            seed=req.seed,
            benchmark_ids=req.benchmark_ids,
            signals=signals,
            verticals=req.verticals,
        )
    except KeyError as e:
        raise HTTPException(status_code=404, detail=str(e))
    return report.to_dict()


@router.post("/compare")
async def compare(req: CompareRequest) -> dict:
    """Evaluate multiple models and rank by PCI (vertical-specific if provided)."""
    signals_map = {
        m: ProvaSignals(**s.model_dump())
        for m, s in (req.signals_by_model or {}).items()
    }
    reports = await _evaluator.evaluate_models(
        model_ids=req.model_ids,
        sample_size=req.sample_size,
        seed=req.seed,
        verticals=[req.vertical] if req.vertical else None,
    )
    ranked = sorted(
        reports.items(),
        key=lambda kv: (
            kv[1].per_vertical_pci.get(req.vertical, kv[1].overall_pci).pci
            if req.vertical else kv[1].overall_pci.pci
        ),
        reverse=True,
    )
    return {
        "vertical": req.vertical,
        "ranking": [
            {
                "rank": i + 1,
                "model_id": m,
                "pci": (
                    rep.per_vertical_pci[req.vertical].pci
                    if req.vertical else rep.overall_pci.pci
                ),
                "report": rep.to_dict(),
            }
            for i, (m, rep) in enumerate(ranked)
        ],
    }


@router.get("/why-prova")
async def why_prova() -> dict:
    """Pitch surface — explains why the PCI is more reliable than any single benchmark."""
    return {
        "thesis": (
            "Public benchmarks fragment capability into narrow tasks, leak into training "
            "data, and miss the domain context that defines real professional work. "
            "Prova's Composite Index aggregates the full public stack, applies "
            "contamination-adjusted weighting, and fuses three layers no public benchmark "
            "captures: peer review by verified domain professionals, performance on real "
            "user-uploaded artifacts, and statistical rigor with confidence intervals."
        ),
        "what_we_subsume": [
            {"benchmark": "ARC AGI 2",         "captured_dimension": "abstract_reasoning"},
            {"benchmark": "MMLU",              "captured_dimension": "broad_knowledge"},
            {"benchmark": "GSM 8K",            "captured_dimension": "math_reasoning"},
            {"benchmark": "HumanEval",         "captured_dimension": "code_generation"},
            {"benchmark": "SWE-Bench",         "captured_dimension": "software_engineering"},
            {"benchmark": "TruthfulQA",        "captured_dimension": "truthfulness"},
            {"benchmark": "GPQA Diamond",      "captured_dimension": "expert_reasoning"},
            {"benchmark": "Terminal Bench 2",  "captured_dimension": "terminal_agency"},
            {"benchmark": "Humanity's Last Exam","captured_dimension": "frontier_knowledge"},
            {"benchmark": "Browser Call",      "captured_dimension": "web_agency"},
            {"benchmark": "MCP Atlas",         "captured_dimension": "tool_use"},
        ],
        "what_we_add": [
            {
                "layer": "professional_verified",
                "description": "Wilson lower-bound on win rate from votes by verified domain experts.",
                "why_it_matters": "No public benchmark has practitioners in the loop. Prova does.",
            },
            {
                "layer": "real_work_generalization",
                "description": "Mean evaluator score on user-uploaded artifacts (cases, contracts, code, reports).",
                "why_it_matters": "Lab benchmarks don't predict performance on the messy real artifacts professionals actually use.",
            },
            {
                "layer": "statistical_rigor",
                "description": "Contamination-adjusted scoring + 95% Wilson confidence intervals on every number.",
                "why_it_matters": "Single-point benchmark numbers are statistical lies. Prova publishes intervals.",
            },
        ],
    }
