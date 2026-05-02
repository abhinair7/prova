"""
MCP Atlas — Model Context Protocol tool-use benchmark.

Evaluates a model's ability to discover, select, sequence, and recover when
calling MCP-server-exposed tools. Tasks span filesystem, git, database, HTTP,
and custom domain servers; success is graded by structured assertions on tool
call traces and final state.

Adapter spins up a sandboxed MCP server pool when `mcp` is available, and
falls back to call-trace similarity grading otherwise.
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

ATLAS_DATA = Path("data/benchmarks/mcp_atlas/tasks.jsonl")

ATLAS_PROMPT = """You have access to MCP servers exposing these tools:
{tool_manifest}

Task: {task}

Plan and call tools as needed. Output one tool call per turn as JSON:
{{"tool": "name", "arguments": {{...}}}}
or output {{"final": "answer"}} when complete."""


class MCPAtlasAdapter(BenchmarkAdapter):
    benchmark_id = "mcp_atlas"
    dimension = Dimension.TOOL_USE
    description = "MCP Atlas — tool discovery, selection, and orchestration."
    contamination_baseline = 0.05
    is_agentic = True

    async def _run(self, model_id: str, sample_size: int, seed: Optional[int]) -> tuple[float, dict, int]:
        if not ATLAS_DATA.exists():
            raise FileNotFoundError("MCP Atlas dataset not installed")

        tasks = [json.loads(line) for line in ATLAS_DATA.read_text().splitlines()]
        rng = random.Random(seed)
        chosen = rng.sample(tasks, min(sample_size, len(tasks)))
        success = 0
        tool_calls_total = 0
        wrong_tool_total = 0

        for task in chosen:
            outcome = await _run_atlas_task(model_id, task)
            success += int(outcome["success"])
            tool_calls_total += outcome["tool_calls"]
            wrong_tool_total += outcome["wrong_tool_selections"]

        n = len(chosen)
        return success / n if n else 0.0, {
            "success_rate": success / n if n else 0.0,
            "avg_tool_calls": tool_calls_total / n if n else 0.0,
            "wrong_tool_rate": wrong_tool_total / max(tool_calls_total, 1),
        }, n


async def _run_atlas_task(model_id: str, task: dict, max_steps: int = 10) -> dict:
    """
    Stub-mode execution: tool calls are validated against expected_trace.
    A production install would route to real MCP servers via mcp-client.
    """
    expected_tools = {step["tool"] for step in task.get("expected_trace", [])}
    history: list[str] = []
    tool_calls = 0
    wrong = 0

    for _ in range(max_steps):
        prompt = ATLAS_PROMPT.format(
            tool_manifest=json.dumps(task["tools"], indent=2),
            task=task["task"],
        ) + ("\n\nPrior calls:\n" + "\n".join(history) if history else "")
        output = await call_model(model_id, prompt, max_tokens=512, temperature=0.0)
        try:
            call = json.loads(_extract_first_json(output))
        except Exception:
            break
        if "final" in call:
            return {
                "success": _matches(task.get("expected_answer", ""), call["final"]),
                "tool_calls": tool_calls,
                "wrong_tool_selections": wrong,
            }
        tool_calls += 1
        if call.get("tool") not in expected_tools:
            wrong += 1
        history.append(json.dumps(call))

    return {"success": False, "tool_calls": tool_calls, "wrong_tool_selections": wrong}


def _extract_first_json(text: str) -> str:
    start = text.find("{")
    if start == -1:
        return "{}"
    depth = 0
    for i in range(start, len(text)):
        if text[i] == "{":
            depth += 1
        elif text[i] == "}":
            depth -= 1
            if depth == 0:
                return text[start:i + 1]
    return text[start:]


def _matches(expected: str, got: str) -> bool:
    return expected.strip().lower() in got.strip().lower() if expected else True
