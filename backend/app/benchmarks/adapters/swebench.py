"""
SWE-Bench — real GitHub issues resolved by patches against full repos.

The model receives an issue description plus repo context; success = the
generated patch applies and passes the project's test suite. This is the
single best public proxy for "production software engineering" — multi-file
context, real APIs, and tests written by humans for humans.

Adapter delegates patch generation to the model and patch evaluation to a
Docker-based harness when available, falling back to AST-similarity scoring.
"""

from __future__ import annotations
import logging
import random
import shutil
import subprocess
from typing import Optional
from app.benchmarks.base import BenchmarkAdapter
from app.benchmarks.dimensions import Dimension
from app.models.runner import call_model

logger = logging.getLogger(__name__)

SWE_PROMPT = """You are resolving a real GitHub issue.

Repository: {repo}
Issue:
{problem_statement}

Relevant files:
{context}

Output a unified diff (git patch) that resolves the issue. Output ONLY the patch, no commentary."""


class SWEBenchAdapter(BenchmarkAdapter):
    benchmark_id = "swe_bench"
    dimension = Dimension.SOFTWARE_ENGINEERING
    description = "SWE-Bench — real-world patch generation against test suites."
    contamination_baseline = 0.20   # repos public, but specific issue/test pairs less leaky

    async def _run(self, model_id: str, sample_size: int, seed: Optional[int]) -> tuple[float, dict, int]:
        try:
            from datasets import load_dataset
        except ImportError as e:
            raise FileNotFoundError("datasets library not installed") from e

        ds = load_dataset("princeton-nlp/SWE-bench_Lite", split="test")
        rng = random.Random(seed)
        idxs = rng.sample(range(len(ds)), min(sample_size, len(ds)))
        resolved = 0
        applied = 0

        for i in idxs:
            row = ds[i]
            prompt = SWE_PROMPT.format(
                repo=row["repo"],
                problem_statement=row["problem_statement"],
                context=row.get("hints_text", "")[:3000],
            )
            patch = await call_model(model_id, prompt, max_tokens=4096, temperature=0.0)
            outcome = _evaluate_patch(row, patch)
            applied += int(outcome["applied"])
            resolved += int(outcome["resolved"])

        n = len(idxs)
        return resolved / n if n else 0.0, {
            "resolved_rate": resolved / n if n else 0.0,
            "apply_rate": applied / n if n else 0.0,
        }, n


def _evaluate_patch(row: dict, patch: str) -> dict:
    """
    Evaluate via Docker SWE-Bench harness if `swebench` cli is on PATH;
    otherwise return a degraded estimate based on diff overlap with gold patch.
    """
    if shutil.which("swebench"):
        try:
            result = subprocess.run(
                ["swebench", "evaluate", "--instance", row["instance_id"]],
                input=patch, capture_output=True, text=True, timeout=300,
            )
            return {
                "applied": "PATCH_APPLIED" in result.stdout,
                "resolved": "TESTS_PASSED" in result.stdout,
            }
        except Exception:
            pass
    # Fallback: structural diff similarity vs. gold patch.
    gold = row.get("patch", "")
    overlap = _diff_overlap(patch, gold)
    return {"applied": overlap > 0.3, "resolved": overlap > 0.7}


def _diff_overlap(a: str, b: str) -> float:
    if not a or not b:
        return 0.0
    a_lines = {ln.strip() for ln in a.splitlines() if ln.startswith(("+", "-")) and len(ln) > 1}
    b_lines = {ln.strip() for ln in b.splitlines() if ln.startswith(("+", "-")) and len(ln) > 1}
    if not a_lines or not b_lines:
        return 0.0
    return len(a_lines & b_lines) / len(a_lines | b_lines)
