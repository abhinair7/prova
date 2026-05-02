"""
Error Analysis & Feedback Loops

When a verified professional votes on a model output:
  1. The vote updates the model's running score for that vertical (Bayesian update)
  2. The losing model's output + context is stored as a fine-tuning signal
  3. Aggregated vote patterns feed back into benchmark weighting
  4. Systematic failure patterns (e.g., "always hallucinates ICD-10") are flagged

Continuous Fine-Tuning signal:
  - Store (query, context, winning_output, losing_output) pairs
  - These become preference data for DPO/RLHF fine-tuning of smaller models
  - Accessible via /api/pipeline/fine-tune-dataset endpoint
"""

import logging
import json
import os
from datetime import datetime
from typing import Optional
from app.schemas.models import VoteRequest, Vertical

logger = logging.getLogger(__name__)


class ScoreAccumulator:
    """
    Bayesian running score update for model leaderboard entries.
    Uses a Wilson confidence interval to avoid overfitting on small N.
    """

    def __init__(self) -> None:
        self._scores: dict[str, dict[str, list[float]]] = {}   # vertical -> model -> [scores]

    def record_vote(self, vote: VoteRequest, scores: dict[str, float]) -> None:
        v = vote.vertical
        if v not in self._scores:
            self._scores[v] = {}

        for model, score in scores.items():
            self._scores[v].setdefault(model, []).append(score)

        logger.info("Vote recorded: vertical=%s chosen=%s", v, vote.chosen_model)

    def get_leaderboard(self, vertical: str) -> list[dict]:
        import math
        entries = self._scores.get(vertical, {})
        result = []
        for model, scores in entries.items():
            n = len(scores)
            mean = sum(scores) / n if n else 0.0
            # Wilson interval for confidence bound
            z = 1.96
            lower = (mean + z * z / (2 * n) - z * math.sqrt((mean * (1 - mean) + z * z / (4 * n)) / n)) / (1 + z * z / n) if n > 0 else 0.0
            upper = (mean + z * z / (2 * n) + z * math.sqrt((mean * (1 - mean) + z * z / (4 * n)) / n)) / (1 + z * z / n) if n > 0 else 0.0
            result.append({
                "model": model,
                "mean_score": mean * 100,
                "n": n,
                "ci_low": lower * 100,
                "ci_high": upper * 100,
                "publishable": n >= 50,   # min 50 evals before publishing
            })
        return sorted(result, key=lambda x: x["mean_score"], reverse=True)


class FeedbackStore:
    """
    Stores vote events and fine-tuning preference pairs to disk.
    In production: replace with a proper data warehouse.
    """

    def __init__(self, store_path: str = "./data/feedback") -> None:
        self.store_path = store_path
        os.makedirs(store_path, exist_ok=True)
        self._accumulator = ScoreAccumulator()

    def record(
        self,
        vote: VoteRequest,
        query: str,
        context: str,
        model_outputs: dict[str, str],
        model_scores: dict[str, float],
        error_patterns: Optional[dict] = None,
    ) -> None:
        self._accumulator.record_vote(vote, model_scores)

        record = {
            "timestamp": datetime.utcnow().isoformat(),
            "evaluation_id": vote.evaluation_id,
            "vertical": vote.vertical,
            "query": query,
            "chosen_model": vote.chosen_model,
            "model_scores": model_scores,
            "error_patterns": error_patterns or {},
        }

        votes_path = os.path.join(self.store_path, "votes.jsonl")
        with open(votes_path, "a") as f:
            f.write(json.dumps(record) + "\n")

        # Store DPO preference pairs for fine-tuning
        chosen_output = model_outputs.get(vote.chosen_model, "")
        for model, output in model_outputs.items():
            if model != vote.chosen_model and chosen_output:
                pair = {
                    "timestamp": record["timestamp"],
                    "vertical": vote.vertical,
                    "prompt": f"Context:\n{context}\n\nQuery: {query}",
                    "chosen": chosen_output,
                    "rejected": output,
                    "chosen_model": vote.chosen_model,
                    "rejected_model": model,
                }
                dpo_path = os.path.join(self.store_path, f"dpo_{vote.vertical}.jsonl")
                with open(dpo_path, "a") as f:
                    f.write(json.dumps(pair) + "\n")

    def get_leaderboard(self, vertical: str) -> list[dict]:
        return self._accumulator.get_leaderboard(vertical)

    def get_fine_tune_dataset(self, vertical: str) -> list[dict]:
        path = os.path.join(self.store_path, f"dpo_{vertical}.jsonl")
        if not os.path.exists(path):
            return []
        pairs = []
        with open(path) as f:
            for line in f:
                try:
                    pairs.append(json.loads(line))
                except json.JSONDecodeError:
                    pass
        return pairs
