"""
GPQA Diamond — graduate-level science multiple choice.

198 PhD-vetted questions across biology, chemistry, physics. Designed to be
"Google-proof": even with web access, non-experts score below 35%. Frontier
models score 65-75%. This dimension feeds Prova's research vertical and is
weighted heavily for technical R&D evaluations.
"""

from __future__ import annotations
import logging
import random
from typing import Optional
from app.benchmarks.base import BenchmarkAdapter
from app.benchmarks.dimensions import Dimension
from app.models.runner import call_model

logger = logging.getLogger(__name__)

GPQA_PROMPT = """A graduate-level science question follows. Reason carefully.

{question}

Options:
A) {a}
B) {b}
C) {c}
D) {d}

After reasoning, end with "Final answer: <letter>"."""


class GPQADiamondAdapter(BenchmarkAdapter):
    benchmark_id = "gpqa_diamond"
    dimension = Dimension.EXPERT_REASONING
    description = "GPQA Diamond — PhD-level science MCQ."
    contamination_baseline = 0.10   # held private aggressively

    async def _run(self, model_id: str, sample_size: int, seed: Optional[int]) -> tuple[float, dict, int]:
        try:
            from datasets import load_dataset
        except ImportError as e:
            raise FileNotFoundError("datasets library not installed") from e

        ds = load_dataset("Idavidrein/gpqa", "gpqa_diamond", split="train")
        rng = random.Random(seed)
        idxs = rng.sample(range(len(ds)), min(sample_size, len(ds)))
        correct = 0
        per_subject: dict[str, list[int]] = {}

        for i in idxs:
            row = ds[i]
            choices = [row["Correct Answer"], row["Incorrect Answer 1"], row["Incorrect Answer 2"], row["Incorrect Answer 3"]]
            order = list(range(4))
            rng.shuffle(order)
            shuffled = [choices[j] for j in order]
            target_idx = order.index(0)
            target = "ABCD"[target_idx]
            prompt = GPQA_PROMPT.format(
                question=row["Question"],
                a=shuffled[0], b=shuffled[1], c=shuffled[2], d=shuffled[3],
            )
            output = await call_model(model_id, prompt, max_tokens=1024, temperature=0.0)
            pred = _parse_letter(output)
            ok = pred == target
            correct += int(ok)
            per_subject.setdefault(row.get("Subdomain", "general"), []).append(int(ok))

        n = len(idxs)
        accuracy = correct / n if n else 0.0
        return accuracy, {"accuracy": accuracy, "subdomains": len(per_subject)}, n


def _parse_letter(text: str) -> Optional[str]:
    import re
    m = re.search(r"final answer\s*:\s*([ABCD])", text, re.IGNORECASE)
    if m:
        return m.group(1).upper()
    for c in reversed(text.upper()):
        if c in "ABCD":
            return c
    return None
