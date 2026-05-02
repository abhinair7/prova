"""
Humanity's Last Exam — extreme expert-level questions across all fields.

3,000+ questions written by domain experts, designed to be unanswerable by
non-specialists even with web access. Frontier models score in the 15-25%
range — the benchmark is intentionally far from saturation.

We treat HLE scores as a "frontier knowledge ceiling" signal: small differences
matter a lot here because the questions probe genuine expert depth.
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

HLE_PROMPT = """{question}

Provide your final answer in the form: "Answer: <your-answer>"."""


class HumanitysLastExamAdapter(BenchmarkAdapter):
    benchmark_id = "humanitys_last_exam"
    dimension = Dimension.FRONTIER_KNOWLEDGE
    description = "Humanity's Last Exam — extreme expert-level frontier eval."
    contamination_baseline = 0.02   # heavily curated against leakage

    async def _run(self, model_id: str, sample_size: int, seed: Optional[int]) -> tuple[float, dict, int]:
        try:
            from datasets import load_dataset
        except ImportError as e:
            raise FileNotFoundError("datasets library not installed") from e

        ds = load_dataset("cais/hle", split="test")
        rng = random.Random(seed)
        idxs = rng.sample(range(len(ds)), min(sample_size, len(ds)))
        correct = 0
        per_field: dict[str, list[int]] = {}

        for i in idxs:
            row = ds[i]
            answer = await call_model(model_id, HLE_PROMPT.format(question=row["question"]), max_tokens=2048, temperature=0.0)
            ok = _grade(answer, row["answer"], row.get("answer_type", "exact"))
            correct += int(ok)
            per_field.setdefault(row.get("category", "general"), []).append(int(ok))

        n = len(idxs)
        accuracy = correct / n if n else 0.0
        return accuracy, {"accuracy": accuracy, "fields": len(per_field)}, n


def _grade(prediction: str, gold: str, answer_type: str) -> bool:
    m = re.search(r"answer\s*:\s*(.+?)(?:\n|$)", prediction, re.IGNORECASE | re.DOTALL)
    pred = (m.group(1) if m else prediction).strip().rstrip(".").lower()
    gold = gold.strip().lower()
    if answer_type == "numeric":
        try:
            return abs(float(pred.replace(",", "")) - float(gold.replace(",", ""))) < 1e-2
        except ValueError:
            return False
    return pred == gold or gold in pred
