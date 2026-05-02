"""
Knowledge Distillation for Smaller Models

Uses large frontier model outputs (teacher) as training targets
to fine-tune smaller, faster models (student) for domain-specific tasks.

Flow:
  1. Teacher models (Claude Opus, GPT-4o) generate high-quality responses
  2. Student candidates (Llama 3.1 8B, Mistral 7B) generate their responses
  3. Human votes from Prova benchmark select the best teacher output
  4. (teacher_prompt, teacher_response) pairs are stored as distillation data
  5. Periodic LoRA fine-tuning of student models on accumulated pairs
  6. Distilled models are benchmarked on Prova to measure improvement

Hardware constraints:
  - Inference: 7B models run on 16GB VRAM / Apple M3 Pro (MPS)
  - Fine-tuning: 4-bit QLoRA reduces memory to ~10GB for 7B models
  - Batch inference on CPU for evaluation (slower but no GPU required)
"""

import logging
import json
import os
from typing import Optional
from datetime import datetime
from app.schemas.models import LLMResponse, Vertical

logger = logging.getLogger(__name__)


class DistillationRecord:
    def __init__(
        self,
        vertical: str,
        query: str,
        context: str,
        teacher_model: str,
        teacher_output: str,
        student_model: str,
        student_output: str,
        human_preferred: str,
        quality_score: float,
    ) -> None:
        self.vertical = vertical
        self.query = query
        self.context = context
        self.teacher_model = teacher_model
        self.teacher_output = teacher_output
        self.student_model = student_model
        self.student_output = student_output
        self.human_preferred = human_preferred
        self.quality_score = quality_score
        self.timestamp = datetime.utcnow().isoformat()

    def to_dpo_format(self) -> dict:
        """Convert to Direct Preference Optimisation (DPO) format."""
        prompt = f"Context:\n{self.context}\n\nQuestion: {self.query}"
        if self.human_preferred == self.teacher_model:
            chosen, rejected = self.teacher_output, self.student_output
        else:
            chosen, rejected = self.student_output, self.teacher_output
        return {
            "prompt": prompt,
            "chosen": chosen,
            "rejected": rejected,
            "vertical": self.vertical,
            "quality_score": self.quality_score,
        }

    def to_sft_format(self) -> dict:
        """Convert teacher output to Supervised Fine-Tuning (SFT) format."""
        return {
            "instruction": self.query,
            "input": self.context,
            "output": self.teacher_output,
            "vertical": self.vertical,
        }


class DistillationPipeline:
    """
    Manages collection of distillation pairs and export for fine-tuning.

    Fine-tuning recipe (not executed here — run offline):
      from peft import LoraConfig, get_peft_model
      config = LoraConfig(r=16, lora_alpha=32, target_modules=["q_proj","v_proj"])
      model = get_peft_model(base_model, config)
      trainer = SFTTrainer(model, dataset=sft_dataset, ...)
    """

    TEACHER_MODELS = {"claude-opus-4-7", "gpt-4o"}
    STUDENT_MODELS = {"mistral-large-latest", "llama-3-8b"}

    def __init__(self, store_path: str = "./data/distillation") -> None:
        self.store_path = store_path
        os.makedirs(store_path, exist_ok=True)

    def record(
        self,
        responses: list[LLMResponse],
        query: str,
        context: str,
        vertical: str,
        human_preferred_model: Optional[str] = None,
    ) -> None:
        teacher_responses = {r.model: r for r in responses if self._is_teacher(r.model)}
        student_responses = {r.model: r for r in responses if self._is_student(r.model)}

        if not teacher_responses or not student_responses:
            return

        for teacher_model, teacher_resp in teacher_responses.items():
            for student_model, student_resp in student_responses.items():
                preferred = human_preferred_model or teacher_model
                quality = teacher_resp.completion_tokens / max(1, teacher_resp.latency_ms / 100)

                record = DistillationRecord(
                    vertical=vertical,
                    query=query,
                    context=context[:2000],
                    teacher_model=teacher_model,
                    teacher_output=teacher_resp.output,
                    student_model=student_model,
                    student_output=student_resp.output,
                    human_preferred=preferred,
                    quality_score=min(1.0, quality),
                )

                dpo_path = os.path.join(self.store_path, f"dpo_{vertical}.jsonl")
                with open(dpo_path, "a") as f:
                    f.write(json.dumps(record.to_dpo_format()) + "\n")

                sft_path = os.path.join(self.store_path, f"sft_{vertical}.jsonl")
                with open(sft_path, "a") as f:
                    f.write(json.dumps(record.to_sft_format()) + "\n")

        logger.debug("Distillation pair recorded: vertical=%s", vertical)

    def get_dataset_stats(self) -> dict[str, int]:
        stats = {}
        for filename in os.listdir(self.store_path):
            if filename.endswith(".jsonl"):
                path = os.path.join(self.store_path, filename)
                with open(path) as f:
                    stats[filename] = sum(1 for _ in f)
        return stats

    @staticmethod
    def _is_teacher(model_name: str) -> bool:
        return any(t.lower() in model_name.lower() for t in ["opus", "gpt-4o", "gpt4"])

    @staticmethod
    def _is_student(model_name: str) -> bool:
        return any(s.lower() in model_name.lower() for s in ["mistral", "llama", "mini", "flash"])
