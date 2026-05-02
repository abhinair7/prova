"""
Chunking & Embeddings — Semantic + Recursive Text Splitting

Strategy:
  1. Try semantic splitting (sentence-level similarity threshold)
  2. Fall back to recursive character splitting (LangChain-style)
  3. Respect hard size limits from config

Each Chunk carries its parent document ID and character offsets so
retrieval results can be traced back to source pages.
"""

import logging
import re
from typing import Optional
from app.schemas.models import Document, Chunk
from app.config import settings

logger = logging.getLogger(__name__)

# Sentence boundary pattern (handles Mr./Dr./etc edge cases)
_SENTENCE_RE = re.compile(r"(?<!\w\.\w.)(?<![A-Z][a-z]\.)(?<=\.|\?|\!)\s")


class SemanticChunker:
    """
    Splits text into semantically coherent chunks using sentence embeddings.
    Falls back gracefully if sentence-transformers isn't available.
    """

    def __init__(
        self,
        chunk_size: int = settings.chunk_size,
        chunk_overlap: int = settings.chunk_overlap,
        min_chunk_size: int = settings.min_chunk_size,
        similarity_threshold: float = 0.45,
    ) -> None:
        self.chunk_size = chunk_size
        self.chunk_overlap = chunk_overlap
        self.min_chunk_size = min_chunk_size
        self.similarity_threshold = similarity_threshold
        self._model = None

    def _get_model(self):
        if self._model is None:
            try:
                from sentence_transformers import SentenceTransformer
                self._model = SentenceTransformer("all-MiniLM-L6-v2", device=settings.device)
            except Exception as exc:
                logger.warning("Sentence model unavailable (%s); using rule-based chunking", exc)
        return self._model

    def chunk_documents(self, documents: list[Document]) -> list[Chunk]:
        all_chunks: list[Chunk] = []
        for doc in documents:
            chunks = self._chunk_document(doc)
            all_chunks.extend(chunks)
        logger.info("Chunked %d docs → %d chunks", len(documents), len(all_chunks))
        return all_chunks

    def _chunk_document(self, doc: Document) -> list[Chunk]:
        model = self._get_model()
        if model:
            return self._semantic_split(doc, model)
        return self._recursive_split(doc)

    def _semantic_split(self, doc: Document, model) -> list[Chunk]:
        """
        Split into sentences, embed each, then merge adjacent sentences
        while their average similarity stays above threshold.
        """
        import numpy as np

        sentences = _SENTENCE_RE.split(doc.content)
        sentences = [s.strip() for s in sentences if len(s.strip()) >= 20]

        if len(sentences) <= 1:
            return self._recursive_split(doc)

        try:
            embeddings = model.encode(sentences, batch_size=64, show_progress_bar=False)
        except Exception as exc:
            logger.warning("Embedding failed during chunking: %s — falling back", exc)
            return self._recursive_split(doc)

        chunks: list[Chunk] = []
        current_sentences: list[str] = [sentences[0]]
        current_start = 0

        for i in range(1, len(sentences)):
            sim = float(np.dot(embeddings[i - 1], embeddings[i]) /
                        (np.linalg.norm(embeddings[i - 1]) * np.linalg.norm(embeddings[i]) + 1e-8))
            current_text = " ".join(current_sentences)

            # Start a new chunk if similarity drops or we exceed size
            if sim < self.similarity_threshold or len(current_text) >= self.chunk_size:
                if len(current_text) >= self.min_chunk_size:
                    char_start = doc.content.find(current_sentences[0], current_start)
                    char_end = char_start + len(current_text)
                    chunks.append(self._make_chunk(doc, current_text, len(chunks), char_start, char_end))
                    current_start = char_start + len(current_text) - self.chunk_overlap

                current_sentences = [sentences[i]]
            else:
                current_sentences.append(sentences[i])

        # Flush remaining
        if current_sentences:
            current_text = " ".join(current_sentences)
            if len(current_text) >= self.min_chunk_size:
                char_start = doc.content.find(current_sentences[0], current_start)
                char_end = char_start + len(current_text)
                chunks.append(self._make_chunk(doc, current_text, len(chunks), char_start, char_end))

        return chunks if chunks else self._recursive_split(doc)

    def _recursive_split(self, doc: Document) -> list[Chunk]:
        """Fallback: split on paragraph → sentence → word boundaries."""
        separators = ["\n\n", "\n", ". ", " ", ""]
        text = doc.content
        chunks: list[Chunk] = []
        self._recursive_helper(doc, text, separators, chunks, offset=0)
        return chunks

    def _recursive_helper(
        self,
        doc: Document,
        text: str,
        separators: list[str],
        chunks: list[Chunk],
        offset: int,
    ) -> None:
        if len(text) <= self.chunk_size:
            if len(text) >= self.min_chunk_size:
                chunks.append(self._make_chunk(doc, text, len(chunks), offset, offset + len(text)))
            return

        sep = separators[0]
        remaining = separators[1:] if len(separators) > 1 else [""]
        parts = text.split(sep) if sep else list(text)

        current = ""
        current_offset = offset

        for part in parts:
            candidate = (current + sep + part) if current else part
            if len(candidate) <= self.chunk_size:
                current = candidate
            else:
                if len(current) >= self.min_chunk_size:
                    chunks.append(self._make_chunk(
                        doc, current, len(chunks), current_offset, current_offset + len(current)
                    ))
                overlap_start = max(0, len(current) - self.chunk_overlap)
                overlap_text = current[overlap_start:]
                current_offset += overlap_start
                current = overlap_text + (sep if overlap_text else "") + part

        if len(current) >= self.min_chunk_size:
            chunks.append(self._make_chunk(doc, current, len(chunks), current_offset, current_offset + len(current)))

    @staticmethod
    def _make_chunk(doc: Document, text: str, index: int, char_start: int, char_end: int) -> Chunk:
        return Chunk(
            content=text.strip(),
            doc_id=doc.id,
            chunk_index=index,
            char_start=char_start,
            char_end=max(char_start, char_end),
            metadata={
                **doc.metadata,
                "source": doc.source,
                "page": doc.page,
            },
        )
