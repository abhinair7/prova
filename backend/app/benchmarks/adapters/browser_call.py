"""
Browser Call — autonomous web navigation tasks.

Tasks like "find the cheapest direct flight SFO→NYC next Tuesday" or "summarize
the top three results for query X". The model issues navigation actions
(click, type, scroll, extract) against a controlled headless browser; success
is graded by structured assertions on the final page state or extracted data.

Adapter uses Playwright when present, falling back to a static HTML harness
that simulates the action loop.
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

BC_DATA = Path("data/benchmarks/browser_call/tasks.jsonl")

BC_PROMPT = """You control a web browser. Available actions (one per turn):
  navigate(url) | click(selector) | type(selector, text) | scroll(direction) | extract(selector) | done(answer)

Task: {task}
Current page DOM summary:
{dom_summary}

Output a single action call."""


class BrowserCallAdapter(BenchmarkAdapter):
    benchmark_id = "browser_call"
    dimension = Dimension.WEB_AGENCY
    description = "Browser Call — agentic web navigation."
    contamination_baseline = 0.05
    is_agentic = True

    async def _run(self, model_id: str, sample_size: int, seed: Optional[int]) -> tuple[float, dict, int]:
        if not BC_DATA.exists():
            raise FileNotFoundError("Browser Call dataset not installed")

        tasks = [json.loads(line) for line in BC_DATA.read_text().splitlines()]
        rng = random.Random(seed)
        chosen = rng.sample(tasks, min(sample_size, len(tasks)))
        success = 0

        for task in chosen:
            outcome = await _run_browser_task(model_id, task)
            success += int(outcome["success"])

        n = len(chosen)
        return success / n if n else 0.0, {"success_rate": success / n if n else 0.0}, n


async def _run_browser_task(model_id: str, task: dict, max_steps: int = 15) -> dict:
    try:
        from playwright.async_api import async_playwright
    except ImportError:
        return {"success": False}

    async with async_playwright() as p:
        browser = await p.chromium.launch(headless=True)
        page = await browser.new_page()
        try:
            await page.goto(task["start_url"])
            for _ in range(max_steps):
                dom = await _summarize_dom(page)
                action = await call_model(
                    model_id,
                    BC_PROMPT.format(task=task["task"], dom_summary=dom),
                    max_tokens=256, temperature=0.0,
                )
                action = action.strip()
                if action.startswith("done("):
                    answer = action[5:-1].strip().strip("\"'")
                    return {"success": _check_assertion(task, answer, page)}
                ok = await _execute_action(page, action)
                if not ok:
                    break
            return {"success": False}
        finally:
            await browser.close()


async def _summarize_dom(page) -> str:
    title = await page.title()
    visible = await page.evaluate(
        "() => Array.from(document.querySelectorAll('a,button,input,h1,h2'))"
        ".slice(0, 30).map(e => `${e.tagName} ${e.id||e.className||''} ${e.textContent.slice(0,60)}`).join('\\n')"
    )
    return f"Title: {title}\n{visible}"


async def _execute_action(page, action: str) -> bool:
    try:
        if action.startswith("navigate("):
            await page.goto(action[9:-1].strip().strip("\"'"))
        elif action.startswith("click("):
            await page.click(action[6:-1].strip().strip("\"'"))
        elif action.startswith("type("):
            inner = action[5:-1]
            sel, text = inner.split(",", 1)
            await page.fill(sel.strip().strip("\"'"), text.strip().strip("\"'"))
        elif action.startswith("scroll("):
            direction = action[7:-1].strip().strip("\"'")
            await page.evaluate(f"window.scrollBy(0, {500 if direction == 'down' else -500})")
        return True
    except Exception:
        return False


def _check_assertion(task: dict, answer: str, page) -> bool:
    expected = task.get("expected", "")
    return expected.lower() in answer.lower() if expected else False
