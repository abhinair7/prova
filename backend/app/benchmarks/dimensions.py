"""
Capability Dimensions

Every public benchmark measures a slice of model capability. Prova's thesis is
that no single benchmark captures professional-grade competence — they fragment
ability into narrow tasks, get gamed via training-set leakage, and miss the
domain context that actually matters in real work.

We enumerate the dimensions the major public benchmarks measure, then add the
dimensions Prova uniquely contributes: professional verification, real-work
generalization, and statistical rigor (confidence intervals, blind eval).

The Prova Composite Index (PCI) is a weighted aggregation across all dimensions,
allowing a single number to reflect a model's true production-readiness.
"""

from __future__ import annotations
from enum import Enum


class Dimension(str, Enum):
    # Reasoning
    ABSTRACT_REASONING = "abstract_reasoning"        # ARC AGI 2 — novel pattern induction
    EXPERT_REASONING = "expert_reasoning"            # GPQA Diamond — PhD-level science
    FRONTIER_KNOWLEDGE = "frontier_knowledge"        # Humanity's Last Exam — extreme expert depth

    # Knowledge / truthfulness
    BROAD_KNOWLEDGE = "broad_knowledge"               # MMLU — 57-subject factual recall
    TRUTHFULNESS = "truthfulness"                     # TruthfulQA — common-misconception resistance

    # Math
    MATH_REASONING = "math_reasoning"                 # GSM 8K — multi-step arithmetic word problems

    # Code
    CODE_GENERATION = "code_generation"               # HumanEval — function-level correctness
    SOFTWARE_ENGINEERING = "software_engineering"     # SWE-Bench — real GitHub issue resolution

    # Agentic
    TERMINAL_AGENCY = "terminal_agency"               # Terminal Bench 2 — CLI multi-step tasks
    WEB_AGENCY = "web_agency"                          # Browser Call — autonomous web navigation
    TOOL_USE = "tool_use"                              # MCP Atlas — MCP tool orchestration

    # Prova-exclusive layers (what no public benchmark covers)
    PROFESSIONAL_VERIFIED = "professional_verified"   # Peer-reviewed by domain practitioners
    REAL_WORK_GENERALIZATION = "real_work_generalization"  # Performance on user-uploaded artifacts
    STATISTICAL_RIGOR = "statistical_rigor"           # Wilson CI, blind eval, contamination resistance


# How much each dimension contributes to the default PCI (sums to 1.0).
# Public-benchmark dimensions cap at 0.55; Prova-exclusive layers carry 0.45,
# encoding the thesis that real-work + professional verification matter at least
# as much as the entire public-benchmark stack combined.
DEFAULT_PCI_WEIGHTS: dict[Dimension, float] = {
    Dimension.ABSTRACT_REASONING:       0.05,
    Dimension.EXPERT_REASONING:         0.06,
    Dimension.FRONTIER_KNOWLEDGE:       0.04,
    Dimension.BROAD_KNOWLEDGE:          0.05,
    Dimension.TRUTHFULNESS:             0.05,
    Dimension.MATH_REASONING:           0.05,
    Dimension.CODE_GENERATION:          0.04,
    Dimension.SOFTWARE_ENGINEERING:     0.06,
    Dimension.TERMINAL_AGENCY:          0.05,
    Dimension.WEB_AGENCY:               0.05,
    Dimension.TOOL_USE:                 0.05,
    Dimension.PROFESSIONAL_VERIFIED:    0.20,
    Dimension.REAL_WORK_GENERALIZATION: 0.15,
    Dimension.STATISTICAL_RIGOR:        0.10,
}


# Per-vertical reweighting: different professions value different dimensions.
# A vertical-specific PCI surfaces the right model for the right job.
VERTICAL_DIMENSION_BIAS: dict[str, dict[Dimension, float]] = {
    "healthcare": {
        Dimension.TRUTHFULNESS: 1.6,
        Dimension.EXPERT_REASONING: 1.4,
        Dimension.PROFESSIONAL_VERIFIED: 1.8,
        Dimension.CODE_GENERATION: 0.3,
        Dimension.WEB_AGENCY: 0.5,
    },
    "legal": {
        Dimension.TRUTHFULNESS: 1.7,
        Dimension.PROFESSIONAL_VERIFIED: 1.8,
        Dimension.BROAD_KNOWLEDGE: 1.3,
        Dimension.MATH_REASONING: 0.6,
        Dimension.CODE_GENERATION: 0.3,
    },
    "finance": {
        Dimension.MATH_REASONING: 1.6,
        Dimension.TRUTHFULNESS: 1.4,
        Dimension.TOOL_USE: 1.3,
        Dimension.PROFESSIONAL_VERIFIED: 1.5,
    },
    "engineering": {
        Dimension.CODE_GENERATION: 1.6,
        Dimension.SOFTWARE_ENGINEERING: 1.8,
        Dimension.TERMINAL_AGENCY: 1.4,
        Dimension.TOOL_USE: 1.3,
        Dimension.FRONTIER_KNOWLEDGE: 0.7,
    },
    "research": {
        Dimension.FRONTIER_KNOWLEDGE: 1.8,
        Dimension.EXPERT_REASONING: 1.6,
        Dimension.ABSTRACT_REASONING: 1.4,
        Dimension.WEB_AGENCY: 1.2,
    },
    "marketing": {
        Dimension.WEB_AGENCY: 1.4,
        Dimension.BROAD_KNOWLEDGE: 1.2,
        Dimension.PROFESSIONAL_VERIFIED: 1.3,
        Dimension.MATH_REASONING: 0.6,
    },
    "accounting": {
        Dimension.MATH_REASONING: 1.7,
        Dimension.TRUTHFULNESS: 1.4,
        Dimension.TOOL_USE: 1.2,
    },
    "hr": {
        Dimension.TRUTHFULNESS: 1.5,
        Dimension.PROFESSIONAL_VERIFIED: 1.6,
        Dimension.BROAD_KNOWLEDGE: 1.2,
        Dimension.MATH_REASONING: 0.6,
        Dimension.CODE_GENERATION: 0.3,
    },
}
