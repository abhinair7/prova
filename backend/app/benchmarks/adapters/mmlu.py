"""
MMLU — Massive Multitask Language Understanding.

57 subjects, 4-option multiple choice. Tests broad factual recall across STEM,
humanities, social sciences, and professional domains. Heavily contaminated in
modern LLM training data — Prova reports an explicit contamination_risk and
de-weights MMLU accordingly in the composite score.
"""

from __future__ import annotations
import logging
import random
from typing import Optional
from app.benchmarks.base import BenchmarkAdapter
from app.benchmarks.dimensions import Dimension
from app.models.runner import call_model

logger = logging.getLogger(__name__)

MMLU_PROMPT = """Question: {question}
A) {a}
B) {b}
C) {c}
D) {d}

Answer with a single letter (A, B, C, or D)."""


class MMLUAdapter(BenchmarkAdapter):
    benchmark_id = "mmlu"
    dimension = Dimension.BROAD_KNOWLEDGE
    description = "MMLU — 57-subject multiple choice."
    contamination_baseline = 0.65   # widely scraped; strong leakage signal

    async def _run(self, model_id: str, sample_size: int, seed: Optional[int]) -> tuple[float, dict, int]:
        try:
            from datasets import load_dataset
        except ImportError as e:
            raise FileNotFoundError("datasets library not installed") from e

        ds = load_dataset("cais/mmlu", "all", split="test")
        rng = random.Random(seed)
        idxs = rng.sample(range(len(ds)), min(sample_size, len(ds)))
        correct = 0
        per_subject: dict[str, list[int]] = {}

        for i in idxs:
            row = ds[i]
            prompt = MMLU_PROMPT.format(
                question=row["question"],
                a=row["choices"][0], b=row["choices"][1],
                c=row["choices"][2], d=row["choices"][3],
            )
            output = (await call_model(model_id, prompt, max_tokens=4, temperature=0.0)).strip().upper()
            pred = next((c for c in output if c in "ABCD"), None)
            target = "ABCD"[row["answer"]]
            ok = pred == target
            correct += int(ok)
            per_subject.setdefault(row["subject"], []).append(int(ok))

        n = len(idxs)
        accuracy = correct / n if n else 0.0
        # Macro-average across subjects to penalize subject-imbalance gaming
        macro = sum(sum(v) / len(v) for v in per_subject.values()) / max(len(per_subject), 1)
        return macro, {"micro_accuracy": accuracy, "macro_accuracy": macro, "subjects": len(per_subject)}, n
