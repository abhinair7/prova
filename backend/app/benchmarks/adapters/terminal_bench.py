"""
Terminal Bench 2 — agentic shell tasks.

Tasks like "find the largest log file in /var, summarize errors, and write
report.md". Success requires planning, tool invocation, recovery from errors,
and verifying side effects on a sandbox filesystem.

Adapter spawns a Docker sandbox per task when available, and falls back to a
trace-similarity score against a reference solution otherwise.
"""

from __future__ import annotations
import json
import logging
import random
import shutil
import subprocess
from pathlib import Path
from typing import Optional
from app.benchmarks.base import BenchmarkAdapter
from app.benchmarks.dimensions import Dimension
from app.models.runner import call_model

logger = logging.getLogger(__name__)

TB_DATA = Path("data/benchmarks/terminal_bench_2/tasks.jsonl")

TB_PROMPT = """You control a Linux shell. To run a command, output:
<cmd>your_shell_command</cmd>
After each command you'll receive its stdout/stderr. When the task is complete, output:
<done>final summary</done>

Task: {task}
Working directory: /workspace"""


class TerminalBench2Adapter(BenchmarkAdapter):
    benchmark_id = "terminal_bench_2"
    dimension = Dimension.TERMINAL_AGENCY
    description = "Terminal Bench 2 — multi-step shell agency."
    contamination_baseline = 0.05
    is_agentic = True

    async def _run(self, model_id: str, sample_size: int, seed: Optional[int]) -> tuple[float, dict, int]:
        if not TB_DATA.exists():
            raise FileNotFoundError("Terminal Bench 2 dataset not installed")

        tasks = [json.loads(line) for line in TB_DATA.read_text().splitlines()]
        rng = random.Random(seed)
        chosen = rng.sample(tasks, min(sample_size, len(tasks)))
        success = 0
        steps_total = 0

        for task in chosen:
            outcome = await _run_task(model_id, task)
            success += int(outcome["success"])
            steps_total += outcome["steps"]

        n = len(chosen)
        return success / n if n else 0.0, {
            "success_rate": success / n if n else 0.0,
            "avg_steps": steps_total / n if n else 0.0,
        }, n


async def _run_task(model_id: str, task: dict, max_steps: int = 12) -> dict:
    if not shutil.which("docker"):
        return {"success": False, "steps": 0}

    container = subprocess.run(
        ["docker", "run", "-d", "--rm", "-v", f"/tmp/tb2-{task['id']}:/workspace", task.get("image", "ubuntu:22.04"), "sleep", "300"],
        capture_output=True, text=True, check=False,
    ).stdout.strip()
    if not container:
        return {"success": False, "steps": 0}

    history: list[str] = []
    try:
        for step in range(max_steps):
            prompt = TB_PROMPT.format(task=task["task"]) + "\n\n" + "\n".join(history)
            output = await call_model(model_id, prompt, max_tokens=512, temperature=0.0)
            if "<done>" in output:
                break
            cmd = _extract_tag(output, "cmd")
            if not cmd:
                break
            result = subprocess.run(
                ["docker", "exec", container, "bash", "-c", cmd],
                capture_output=True, text=True, timeout=30, check=False,
            )
            history.append(f"<cmd>{cmd}</cmd>\nstdout: {result.stdout[:1000]}\nstderr: {result.stderr[:500]}")

        verify = subprocess.run(
            ["docker", "exec", container, "bash", "-c", task["verify"]],
            capture_output=True, text=True, timeout=20, check=False,
        )
        return {"success": verify.returncode == 0, "steps": len(history)}
    finally:
        subprocess.run(["docker", "stop", container], capture_output=True, check=False)


def _extract_tag(text: str, tag: str) -> Optional[str]:
    open_t, close_t = f"<{tag}>", f"</{tag}>"
    if open_t not in text:
        return None
    start = text.index(open_t) + len(open_t)
    end = text.index(close_t, start) if close_t in text[start:] else len(text)
    return text[start:end].strip()
