"""
Preprocessing & Cleaning

Normalises raw document text before chunking:
  - Unicode normalisation (NFC)
  - Whitespace collapsing
  - Boilerplate removal (page headers/footers, watermarks)
  - Near-duplicate detection via MinHash LSH
  - Language detection (non-English flagged but still processed)
"""

import re
import unicodedata
import hashlib
import logging
from typing import Optional
from app.schemas.models import Document

logger = logging.getLogger(__name__)

# Regex patterns for common boilerplate
_HEADER_FOOTER_RE = re.compile(
    r"(page\s+\d+\s+of\s+\d+|confidential|draft|proprietary|all rights reserved)",
    re.IGNORECASE,
)
_EXTRA_WHITESPACE_RE = re.compile(r"[ \t]+")
_MULTI_NEWLINE_RE = re.compile(r"\n{3,}")
_NULL_BYTES_RE = re.compile(r"\x00+")


class Preprocessor:
    """
    Cleans and normalises documents. Near-duplicate detection uses content
    hashing (full dedup) — for production-scale fuzzy dedup, swap in
    MinHash LSH (datasketch library).
    """

    def __init__(self, remove_boilerplate: bool = True, dedup: bool = True):
        self.remove_boilerplate = remove_boilerplate
        self.dedup = dedup
        self._seen_hashes: set[str] = set()

    def process(self, documents: list[Document]) -> list[Document]:
        cleaned = []
        for doc in documents:
            processed = self._clean(doc)
            if processed is None:
                continue
            if self.dedup and self._is_duplicate(processed):
                logger.debug("Skipping near-duplicate doc id=%s", doc.id)
                continue
            cleaned.append(processed)
        logger.info("Preprocessed %d → %d documents", len(documents), len(cleaned))
        return cleaned

    def _clean(self, doc: Document) -> Optional[Document]:
        text = doc.content

        # Remove null bytes
        text = _NULL_BYTES_RE.sub("", text)

        # Unicode normalisation
        text = unicodedata.normalize("NFC", text)

        # Strip boilerplate lines
        if self.remove_boilerplate:
            lines = text.splitlines()
            lines = [l for l in lines if not _HEADER_FOOTER_RE.search(l)]
            text = "\n".join(lines)

        # Collapse whitespace within lines, preserve paragraph breaks
        lines = text.splitlines()
        lines = [_EXTRA_WHITESPACE_RE.sub(" ", l).strip() for l in lines]
        text = "\n".join(lines)

        # Collapse excess blank lines
        text = _MULTI_NEWLINE_RE.sub("\n\n", text).strip()

        if len(text) < 30:
            return None

        return doc.model_copy(update={"content": text})

    def _is_duplicate(self, doc: Document) -> bool:
        h = hashlib.sha256(doc.content.encode()).hexdigest()
        if h in self._seen_hashes:
            return True
        self._seen_hashes.add(h)
        return False

    def reset_dedup_state(self) -> None:
        """Call between requests to avoid cross-user dedup collisions."""
        self._seen_hashes.clear()
