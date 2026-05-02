"""
Prova benchmarks package.

The composite/dimensions layer is importable standalone for testing. Adapters
and the meta-evaluator are imported lazily because they transitively depend on
the full backend stack (model runner, datasets, etc.).
"""

from app.benchmarks.base import BenchmarkAdapter, BenchmarkResult
from app.benchmarks.composite import PCIBreakdown, ProvaSignals, compute_pci
from app.benchmarks.dimensions import Dimension, DEFAULT_PCI_WEIGHTS, VERTICAL_DIMENSION_BIAS

__all__ = [
    "BenchmarkAdapter", "BenchmarkResult",
    "Dimension", "DEFAULT_PCI_WEIGHTS", "VERTICAL_DIMENSION_BIAS",
    "PCIBreakdown", "ProvaSignals", "compute_pci",
]


def __getattr__(name: str):
    """Lazy imports for the heavy adapter/registry/meta layer."""
    if name in ("MetaEvaluator", "MetaEvaluationReport"):
        from app.benchmarks.meta_evaluator import MetaEvaluator, MetaEvaluationReport
        return {"MetaEvaluator": MetaEvaluator, "MetaEvaluationReport": MetaEvaluationReport}[name]
    if name in ("all_adapters", "get_adapter", "list_benchmarks", "adapters_by_dimension"):
        from app.benchmarks.registry import (
            all_adapters, get_adapter, list_benchmarks, adapters_by_dimension,
        )
        return {
            "all_adapters": all_adapters, "get_adapter": get_adapter,
            "list_benchmarks": list_benchmarks, "adapters_by_dimension": adapters_by_dimension,
        }[name]
    raise AttributeError(f"module 'app.benchmarks' has no attribute {name!r}")
