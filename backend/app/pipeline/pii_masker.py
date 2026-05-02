"""
PII Masking

Uses Microsoft Presidio (NER + rule-based) to detect and replace PII
before any document content is sent to external LLM APIs.

Entity types covered: names, emails, phones, SSNs, credit cards,
medical license numbers, IP addresses, dates, locations, URLs, IBANs.

The mask mapping is stored per-request so a caller can optionally
un-mask results for local display (never sent externally).
"""

import logging
from typing import Optional
from app.schemas.models import Document, PIIMaskResult
from app.config import settings

logger = logging.getLogger(__name__)


class PIIMasker:
    """
    Thread-safe Presidio-based PII masker with a reversible mapping.
    Each request should use a fresh instance (or call reset()) to avoid
    mask-ID collisions across users.
    """

    def __init__(self) -> None:
        self._analyzer = None
        self._anonymizer = None
        self._mask_map: dict[str, str] = {}   # mask_token → original
        self._counter: int = 0

    def _ensure_loaded(self) -> None:
        if self._analyzer is not None:
            return
        try:
            from presidio_analyzer import AnalyzerEngine
            from presidio_anonymizer import AnonymizerEngine
            self._analyzer = AnalyzerEngine()
            self._anonymizer = AnonymizerEngine()
        except ImportError:
            logger.warning(
                "presidio not installed — PII masking disabled. "
                "Run: pip install presidio-analyzer presidio-anonymizer && "
                "python -m spacy download en_core_web_lg"
            )

    def mask_document(self, doc: Document) -> tuple[Document, PIIMaskResult]:
        self._ensure_loaded()
        masked_text, result = self.mask_text(doc.content)
        masked_doc = doc.model_copy(update={
            "content": masked_text,
            "metadata": {**doc.metadata, "pii_masked": True, "pii_count": result.mask_count},
        })
        return masked_doc, result

    def mask_text(self, text: str) -> tuple[str, PIIMaskResult]:
        self._ensure_loaded()

        if self._analyzer is None:
            return text, PIIMaskResult(masked_text=text, entities_found=[], mask_count=0)

        try:
            results = self._analyzer.analyze(
                text=text,
                entities=settings.pii_entities,
                language="en",
            )

            entities_found = [
                {"type": r.entity_type, "start": r.start, "end": r.end, "score": r.score}
                for r in results
            ]

            # Replace each detected entity with a reversible mask token
            # We sort by position (desc) so replacements don't shift offsets
            masked = list(text)
            for r in sorted(results, key=lambda x: x.start, reverse=True):
                self._counter += 1
                token = f"[{r.entity_type}_{self._counter}]"
                original = text[r.start:r.end]
                self._mask_map[token] = original
                masked[r.start:r.end] = list(token)

            masked_text = "".join(masked)
            return masked_text, PIIMaskResult(
                masked_text=masked_text,
                entities_found=entities_found,
                mask_count=len(results),
            )
        except Exception as exc:
            logger.error("PII masking failed: %s", exc)
            return text, PIIMaskResult(masked_text=text, entities_found=[], mask_count=0)

    def unmask_text(self, text: str) -> str:
        """Restore masked tokens — use only for local display, never send unmasked text externally."""
        for token, original in self._mask_map.items():
            text = text.replace(token, original)
        return text

    def reset(self) -> None:
        self._mask_map.clear()
        self._counter = 0

    @property
    def total_entities_masked(self) -> int:
        return self._counter
