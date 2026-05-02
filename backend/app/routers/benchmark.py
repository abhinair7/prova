"""Benchmark API — leaderboards, scores, confidence intervals."""

import logging
from fastapi import APIRouter, Query, HTTPException, Request
from app.schemas.models import LeaderboardEntry, Vertical

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/benchmark", tags=["Benchmark"])

# Seeded leaderboard data (in production: read from PostgreSQL with live vote tallies)
_SEED_DATA: dict[str, list[dict]] = {
    "healthcare": [
        {"rank": 1, "model": "Claude 4 Opus", "provider": "Anthropic", "overall": 94.2,
         "reasoning": 96.1, "accuracy": 93.4, "hallucination_trust": 99.1,
         "latency_p50": 1920, "evaluation_count": 12341, "ci_low": 93.8, "ci_high": 94.6, "trend": "up"},
        {"rank": 2, "model": "GPT-5", "provider": "OpenAI", "overall": 92.8,
         "reasoning": 94.3, "accuracy": 91.7, "hallucination_trust": 98.4,
         "latency_p50": 1310, "evaluation_count": 10892, "ci_low": 92.3, "ci_high": 93.3, "trend": "up"},
        {"rank": 3, "model": "Gemini 2.5 Pro", "provider": "Google", "overall": 88.6,
         "reasoning": 90.2, "accuracy": 87.4, "hallucination_trust": 97.3,
         "latency_p50": 1050, "evaluation_count": 7231, "ci_low": 87.9, "ci_high": 89.3, "trend": "stable"},
        {"rank": 4, "model": "Llama 4 Maverick", "provider": "Meta", "overall": 84.3,
         "reasoning": 85.1, "accuracy": 83.9, "hallucination_trust": 95.6,
         "latency_p50": 780, "evaluation_count": 4512, "ci_low": 83.4, "ci_high": 85.2, "trend": "up"},
    ],
    "legal": [
        {"rank": 1, "model": "GPT-5", "provider": "OpenAI", "overall": 91.4,
         "reasoning": 93.2, "accuracy": 90.1, "hallucination_trust": 97.8,
         "latency_p50": 1240, "evaluation_count": 8412, "ci_low": 90.9, "ci_high": 91.9, "trend": "up"},
        {"rank": 2, "model": "Claude 4 Opus", "provider": "Anthropic", "overall": 89.7,
         "reasoning": 94.1, "accuracy": 88.4, "hallucination_trust": 98.6,
         "latency_p50": 1850, "evaluation_count": 7203, "ci_low": 89.1, "ci_high": 90.3, "trend": "up"},
        {"rank": 3, "model": "Gemini 2.5 Pro", "provider": "Google", "overall": 87.3,
         "reasoning": 88.9, "accuracy": 86.7, "hallucination_trust": 96.2,
         "latency_p50": 980, "evaluation_count": 5891, "ci_low": 86.6, "ci_high": 88.0, "trend": "stable"},
    ],
    "finance": [
        {"rank": 1, "model": "GPT-5", "provider": "OpenAI", "overall": 93.1,
         "reasoning": 94.8, "accuracy": 92.3, "hallucination_trust": 98.7,
         "latency_p50": 1180, "evaluation_count": 9823, "ci_low": 92.6, "ci_high": 93.6, "trend": "up"},
        {"rank": 2, "model": "Claude 4 Opus", "provider": "Anthropic", "overall": 91.7,
         "reasoning": 95.2, "accuracy": 89.8, "hallucination_trust": 99.2,
         "latency_p50": 1890, "evaluation_count": 8341, "ci_low": 91.1, "ci_high": 92.3, "trend": "up"},
    ],
}


@router.get("/{vertical}", response_model=list[LeaderboardEntry])
async def get_leaderboard(
    vertical: Vertical,
    sort_by: str = Query("overall", description="Sort field"),
    min_evals: int = Query(50, description="Minimum evaluations to appear"),
    request: Request = None,
) -> list[dict]:
    """Get the ranked leaderboard for a vertical."""
    data = _SEED_DATA.get(vertical.value, [])
    filtered = [e for e in data if e["evaluation_count"] >= min_evals]

    if sort_by in ("overall", "reasoning", "accuracy", "hallucination_trust"):
        filtered.sort(key=lambda x: x.get(sort_by, 0), reverse=True)
    elif sort_by == "latency":
        filtered.sort(key=lambda x: x.get("latency_p50", 9999))

    # Re-rank after sort
    for i, entry in enumerate(filtered):
        entry["rank"] = i + 1

    return filtered


@router.get("")
async def list_verticals() -> dict:
    """List all available vertical leaderboards."""
    return {
        "verticals": list(_SEED_DATA.keys()),
        "total_evaluations": sum(
            sum(e["evaluation_count"] for e in entries)
            for entries in _SEED_DATA.values()
        ),
    }
