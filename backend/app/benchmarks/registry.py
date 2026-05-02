"""
Registry — single source of truth mapping benchmark IDs to adapters and the
Dimension each one measures. Used by the meta-evaluator to enumerate, by the
composite scorer to map results back to dimensions, and by the API to expose
the available benchmark catalog.
"""

from __future__ import annotations
from app.benchmarks.adapters import (
    ArcAgi2Adapter, MMLUAdapter, GSM8KAdapter, HumanEvalAdapter,
    SWEBenchAdapter, TruthfulQAAdapter, GPQADiamondAdapter,
    TerminalBench2Adapter, HumanitysLastExamAdapter,
    BrowserCallAdapter, MCPAtlasAdapter,
)
from app.benchmarks.base import BenchmarkAdapter
from app.benchmarks.dimensions import Dimension


_ADAPTER_CLASSES: list[type[BenchmarkAdapter]] = [
    ArcAgi2Adapter, MMLUAdapter, GSM8KAdapter, HumanEvalAdapter,
    SWEBenchAdapter, TruthfulQAAdapter, GPQADiamondAdapter,
    TerminalBench2Adapter, HumanitysLastExamAdapter,
    BrowserCallAdapter, MCPAtlasAdapter,
]


_INSTANCES: dict[str, BenchmarkAdapter] = {cls().benchmark_id: cls() for cls in _ADAPTER_CLASSES}


def list_benchmarks() -> list[dict]:
    """Catalog of all registered benchmarks for API exposure."""
    return [
        {
            "id": adapter.benchmark_id,
            "dimension": adapter.dimension.value,
            "description": adapter.description,
            "contamination_baseline": adapter.contamination_baseline,
            "is_agentic": adapter.is_agentic,
        }
        for adapter in _INSTANCES.values()
    ]


def get_adapter(benchmark_id: str) -> BenchmarkAdapter:
    if benchmark_id not in _INSTANCES:
        raise KeyError(f"Unknown benchmark: {benchmark_id}")
    return _INSTANCES[benchmark_id]


def all_adapters() -> list[BenchmarkAdapter]:
    return list(_INSTANCES.values())


def adapters_by_dimension(dim: Dimension) -> list[BenchmarkAdapter]:
    return [a for a in _INSTANCES.values() if a.dimension == dim]
