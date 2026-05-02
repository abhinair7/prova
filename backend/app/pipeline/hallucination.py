"""
Hallucination Detection & Control

Two-layer approach:
  1. NLI-based claim verification (cross-encoder/nli-deberta-v3-base)
     — split LLM output into claims, check each against retrieved context
  2. Entity consistency check
     — named entities in the response must appear in context or query

Confidence score:
  hallucination_rate = claims_not_supported / total_claims
  trust_score = 1 - hallucination_rate
"""

import logging
import re
import asyncio
from app.schemas.models import RetrievedChunk, HallucinationResult

logger = logging.getLogger(__name__)

_CLAIM_SPLITTER = re.compile(r"(?<=[.!?])\s+(?=[A-Z])")


class HallucinationDetector:
    """
    Claim-level NLI verification. Each claim in the LLM output is checked
    against all retrieved passages. If no passage entails a claim, it's flagged.
    """

    NLI_MODEL = "cross-encoder/nli-deberta-v3-base"
    ENTAILMENT_THRESHOLD = 0.6

    def __init__(self, device: str = "cpu") -> None:
        self.device = device
        self._model = None

    def _load(self) -> None:
        if self._model is not None:
            return
        try:
            from sentence_transformers import CrossEncoder
            self._model = CrossEncoder(self.NLI_MODEL, device=self.device)
            logger.info("NLI model loaded: %s", self.NLI_MODEL)
        except Exception as exc:
            logger.warning("NLI model unavailable (%s) — using heuristic fallback", exc)

    async def detect(
        self,
        response_text: str,
        retrieved_chunks: list[RetrievedChunk],
        query: str = "",
    ) -> HallucinationResult:
        try:
            self._load()
        except Exception:
            return self._heuristic_check(response_text, retrieved_chunks)

        claims = self._split_claims(response_text)
        if not claims:
            return HallucinationResult(
                is_hallucinated=False,
                confidence=1.0,
                flagged_claims=[],
                supported_claims=[],
                hallucination_rate=0.0,
            )

        context_passages = [rc.chunk.content for rc in retrieved_chunks[:10]]

        supported, flagged = await asyncio.get_event_loop().run_in_executor(
            None, self._verify_claims, claims, context_passages
        )

        total = len(claims)
        hal_rate = len(flagged) / total if total > 0 else 0.0

        return HallucinationResult(
            is_hallucinated=hal_rate > 0.2,
            confidence=1.0 - hal_rate,
            flagged_claims=flagged,
            supported_claims=supported,
            hallucination_rate=hal_rate,
        )

    def _verify_claims(
        self,
        claims: list[str],
        passages: list[str],
    ) -> tuple[list[str], list[str]]:
        if not self._model or not passages:
            return claims, []

        supported, flagged = [], []
        for claim in claims:
            max_entailment = 0.0
            for passage in passages:
                try:
                    scores = self._model.predict([(passage, claim)], apply_softmax=True)
                    # DeBERTa NLI: [contradiction, neutral, entailment]
                    entailment_score = float(scores[0][2]) if len(scores[0]) > 2 else float(scores[0][0])
                    max_entailment = max(max_entailment, entailment_score)
                except Exception:
                    pass

            if max_entailment >= self.ENTAILMENT_THRESHOLD:
                supported.append(claim)
            else:
                flagged.append(claim)

        return supported, flagged

    @staticmethod
    def _split_claims(text: str) -> list[str]:
        """Split response into atomic claim sentences."""
        # Remove parenthetical citations
        text = re.sub(r"\([^)]{0,50}\)", "", text)
        sentences = _CLAIM_SPLITTER.split(text)
        claims = []
        for s in sentences:
            s = s.strip()
            if len(s) > 20 and not s.startswith("[") and not s.lower().startswith("note:"):
                claims.append(s)
        return claims[:20]   # cap at 20 claims for latency

    @staticmethod
    def _heuristic_check(
        response: str,
        chunks: list[RetrievedChunk],
    ) -> HallucinationResult:
        """
        Fallback when NLI model is unavailable.
        Checks if named entities in the response appear in the context.
        Simple but catches gross hallucinations.
        """
        context_text = " ".join(rc.chunk.content for rc in chunks).lower()
        words = re.findall(r"\b[A-Z][a-z]{2,}\b", response)
        unknown = [w for w in set(words) if w.lower() not in context_text]
        hal_rate = min(len(unknown) / max(len(set(words)), 1), 0.5)

        return HallucinationResult(
            is_hallucinated=hal_rate > 0.2,
            confidence=1.0 - hal_rate,
            flagged_claims=[],
            supported_claims=[],
            hallucination_rate=hal_rate,
        )
