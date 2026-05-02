"""
Reference scores for fallback when benchmark datasets aren't installed locally.

These are illustrative published or estimated scores per (benchmark, model)
used solely for development/demo. They are NOT authoritative — production
runs go through the real adapters with the real datasets.

Numbers are normalized 0–1.
"""

from __future__ import annotations

# Maps benchmark_id → model_id → score in [0, 1].
REFERENCE: dict[str, dict[str, float]] = {
    "arc_agi_2": {
        "claude-4-opus":   0.51,
        "gpt-5":           0.46,
        "gemini-2.5-pro":  0.39,
        "llama-4":         0.18,
        "mistral-large":   0.16,
    },
    "mmlu": {
        "claude-4-opus":   0.91,
        "gpt-5":           0.92,
        "gemini-2.5-pro":  0.90,
        "llama-4":         0.85,
        "mistral-large":   0.83,
    },
    "gsm8k": {
        "claude-4-opus":   0.97,
        "gpt-5":           0.97,
        "gemini-2.5-pro":  0.96,
        "llama-4":         0.93,
        "mistral-large":   0.91,
    },
    "humaneval": {
        "claude-4-opus":   0.94,
        "gpt-5":           0.93,
        "gemini-2.5-pro":  0.91,
        "llama-4":         0.84,
        "mistral-large":   0.79,
    },
    "swe_bench": {
        "claude-4-opus":   0.72,
        "gpt-5":           0.69,
        "gemini-2.5-pro":  0.58,
        "llama-4":         0.34,
        "mistral-large":   0.28,
    },
    "truthful_qa": {
        "claude-4-opus":   0.78,
        "gpt-5":           0.75,
        "gemini-2.5-pro":  0.73,
        "llama-4":         0.62,
        "mistral-large":   0.59,
    },
    "gpqa_diamond": {
        "claude-4-opus":   0.71,
        "gpt-5":           0.70,
        "gemini-2.5-pro":  0.65,
        "llama-4":         0.45,
        "mistral-large":   0.40,
    },
    "terminal_bench_2": {
        "claude-4-opus":   0.66,
        "gpt-5":           0.62,
        "gemini-2.5-pro":  0.54,
        "llama-4":         0.31,
        "mistral-large":   0.27,
    },
    "humanitys_last_exam": {
        "claude-4-opus":   0.21,
        "gpt-5":           0.19,
        "gemini-2.5-pro":  0.15,
        "llama-4":         0.06,
        "mistral-large":   0.05,
    },
    "browser_call": {
        "claude-4-opus":   0.68,
        "gpt-5":           0.64,
        "gemini-2.5-pro":  0.59,
        "llama-4":         0.32,
        "mistral-large":   0.28,
    },
    "mcp_atlas": {
        "claude-4-opus":   0.74,
        "gpt-5":           0.69,
        "gemini-2.5-pro":  0.63,
        "llama-4":         0.36,
        "mistral-large":   0.31,
    },
}


def lookup_reference_score(benchmark_id: str, model_id: str) -> float:
    """Return reference score, defaulting to 0.5 for unknown models."""
    return REFERENCE.get(benchmark_id, {}).get(model_id, 0.5)
