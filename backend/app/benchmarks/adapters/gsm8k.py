"""
GSM 8K — grade-school math word problems requiring multi-step reasoning.

Evaluates chain-of-thought arithmetic. We extract the final numeric answer and
match against the gold value. Modern frontier models saturate this benchmark
(>95%); Prova surfaces math reasoning under domain context (finance, accounting)
where applied calculation matters more than the canonical GSM format.
"""

from __future__ import annotations
import logging
import random
import re
from typing import Optional
from app.benchmarks.base import BenchmarkAdapter
from app.benchmarks.dimensions import Dimension
from app.models.runner import call_model

logger = logging.getLogger(__name__)

GSM_PROMPT = """Solve this math word problem. Show your reasoning, then end with "Answer: <number>" on its own line.

Problem: {question}"""

ANSWER_PATTERN = re.compile(r"answer\s*:\s*(-?\$?[\d,]+(?:\.\d+)?)", re.IGNORECASE)
GOLD_PATTERN = re.compile(r"####\s*(-?[\d,]+(?:\.\d+)?)")


class GSM8KAdapter(BenchmarkAdapter):
    benchmark_id = "gsm8k"
    dimension = Dimension.MATH_REASONING
    description = "GSM 8K — multi-step grade-school math."
    contamination_baseline = 0.55

    async def _run(self, model_id: str, sample_size: int, seed: Optional[int]) -> tuple[float, dict, int]:
        try:
            from datasets import load_dataset
        except ImportError as e:
            raise FileNotFoundError("datasets library not installed") from e

        ds = load_dataset("gsm8k", "main", split="test")
        rng = random.Random(seed)
        idxs = rng.sample(range(len(ds)), min(sample_size, len(ds)))
        correct = 0

        for i in idxs:
            row = ds[i]
            prompt = GSM_PROMPT.format(question=row["question"])
            output = await call_model(model_id, prompt, max_tokens=512, temperature=0.0)
            pred = _parse_number(ANSWER_PATTERN, output)
            gold = _parse_number(GOLD_PATTERN, row["answer"])
            if pred is not None and gold is not None and abs(pred - gold) < 1e-3:
                correct += 1

        n = len(idxs)
        return correct / n if n else 0.0, {"exact_match": correct / n if n else 0.0}, n


def _parse_number(pattern: re.Pattern, text: str) -> Optional[float]:
    m = pattern.search(text)
    if not m:
        return None
    raw = m.group(1).replace(",", "").replace("$", "")
    try:
        return float(raw)
    except ValueError:
        return None
