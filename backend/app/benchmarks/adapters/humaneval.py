"""
HumanEval — function-level Python code synthesis.

Each task gives a function signature + docstring; the model completes the body.
Grading runs the test suite in a sandbox and reports pass@1. Heavily contaminated
in modern training corpora — Prova de-weights it and surfaces the more
production-relevant SWE-Bench dimension instead.
"""

from __future__ import annotations
import logging
import random
import subprocess
import tempfile
import textwrap
from pathlib import Path
from typing import Optional
from app.benchmarks.base import BenchmarkAdapter
from app.benchmarks.dimensions import Dimension
from app.models.runner import call_model

logger = logging.getLogger(__name__)

HE_PROMPT = """Complete the following Python function. Return ONLY the function body and any helper code, no markdown fences.

{prompt}"""


class HumanEvalAdapter(BenchmarkAdapter):
    benchmark_id = "humaneval"
    dimension = Dimension.CODE_GENERATION
    description = "HumanEval — function-level pass@1."
    contamination_baseline = 0.70

    async def _run(self, model_id: str, sample_size: int, seed: Optional[int]) -> tuple[float, dict, int]:
        try:
            from datasets import load_dataset
        except ImportError as e:
            raise FileNotFoundError("datasets library not installed") from e

        ds = load_dataset("openai_humaneval", split="test")
        rng = random.Random(seed)
        idxs = rng.sample(range(len(ds)), min(sample_size, len(ds)))
        passed = 0

        for i in idxs:
            row = ds[i]
            prompt = HE_PROMPT.format(prompt=row["prompt"])
            completion = await call_model(model_id, prompt, max_tokens=1024, temperature=0.0)
            full = row["prompt"] + _strip_fences(completion) + "\n" + row["test"] + f"\ncheck({row['entry_point']})\n"
            if _run_in_sandbox(full):
                passed += 1

        n = len(idxs)
        return passed / n if n else 0.0, {"pass@1": passed / n if n else 0.0}, n


def _strip_fences(text: str) -> str:
    text = text.strip()
    if text.startswith("```"):
        lines = text.splitlines()
        if lines[0].startswith("```"):
            lines = lines[1:]
        if lines and lines[-1].startswith("```"):
            lines = lines[:-1]
        text = "\n".join(lines)
    return textwrap.dedent(text)


def _run_in_sandbox(code: str, timeout: float = 5.0) -> bool:
    """Execute candidate code in a subprocess. True if exit 0."""
    with tempfile.NamedTemporaryFile("w", suffix=".py", delete=False) as f:
        f.write(code)
        path = f.name
    try:
        result = subprocess.run(
            ["python3", path], timeout=timeout,
            capture_output=True, check=False,
        )
        return result.returncode == 0
    except subprocess.TimeoutExpired:
        return False
    finally:
        Path(path).unlink(missing_ok=True)
