"""
ARC AGI 2 — abstract pattern induction on grid-based puzzles.

Each task gives a few input/output grid examples; the model must infer the
transformation rule and apply it to a held-out input. Measures fluid
intelligence — the dimension public LLM benchmarks consistently miss.

Adapter loads the official ARC-AGI-2 task JSON files and grades by exact
grid match. Falls back to reference scores when the dataset isn't available.
"""

from __future__ import annotations
import json
import logging
import random
from pathlib import Path
from typing import Optional
from app.benchmarks.base import BenchmarkAdapter
from app.benchmarks.dimensions import Dimension
from app.models.runner import call_model

logger = logging.getLogger(__name__)

ARC_DATA_DIR = Path("data/benchmarks/arc_agi_2/evaluation")

ARC_PROMPT = """You are given example input/output grids for a transformation puzzle.
Infer the rule and apply it to the test input. Return ONLY the output grid as a JSON array of arrays of integers.

Examples:
{examples}

Test input:
{test_input}

Output grid (JSON only):"""


class ArcAgi2Adapter(BenchmarkAdapter):
    benchmark_id = "arc_agi_2"
    dimension = Dimension.ABSTRACT_REASONING
    description = "ARC-AGI-2 — fluid abstract reasoning over grid puzzles."
    contamination_baseline = 0.05   # private holdout, very low leakage

    async def _run(self, model_id: str, sample_size: int, seed: Optional[int]) -> tuple[float, dict, int]:
        if not ARC_DATA_DIR.exists():
            raise FileNotFoundError("ARC-AGI-2 dataset not installed")
        rng = random.Random(seed)
        files = list(ARC_DATA_DIR.glob("*.json"))
        chosen = rng.sample(files, min(sample_size, len(files)))

        correct = 0
        for path in chosen:
            task = json.loads(path.read_text())
            examples = "\n\n".join(
                f"In: {ex['input']}\nOut: {ex['output']}" for ex in task["train"]
            )
            test = task["test"][0]
            prompt = ARC_PROMPT.format(examples=examples, test_input=test["input"])
            output = await call_model(model_id, prompt, max_tokens=2048, temperature=0.0)
            try:
                pred = json.loads(_extract_json(output))
                if pred == test["output"]:
                    correct += 1
            except Exception:
                continue

        n = len(chosen)
        return correct / n if n else 0.0, {"exact_match": correct / n if n else 0.0}, n


def _extract_json(text: str) -> str:
    start = text.find("[")
    end = text.rfind("]")
    return text[start:end + 1] if start != -1 and end != -1 else text
