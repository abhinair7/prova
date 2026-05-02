"""
Embedder — Dense vector representations

Uses BAAI/bge-large-en-v1.5 (1024-dim) as default.
BGE models prepend "Represent this sentence for searching relevant passages: "
to query strings, not to document strings — this is handled here.

Batched encoding with configurable batch size for hardware constraint
management.
"""

import logging
import numpy as np
from typing import Optional
from app.schemas.models import Chunk
from app.config import settings

logger = logging.getLogger(__name__)

_BGE_QUERY_PREFIX = "Represent this sentence for searching relevant passages: "


class Embedder:
    """
    Wraps sentence-transformers with BGE-specific query prefix handling,
    L2 normalisation, and batch processing.
    """

    def __init__(
        self,
        model_name: str = settings.embedding_model,
        device: str = settings.device,
        batch_size: int = settings.embedding_batch_size,
    ) -> None:
        self.model_name = model_name
        self.device = device
        self.batch_size = batch_size
        self._model = None
        self._dim: Optional[int] = None

    def _load(self) -> None:
        if self._model is not None:
            return
        try:
            from sentence_transformers import SentenceTransformer
            self._model = SentenceTransformer(self.model_name, device=self.device)
            self._dim = self._model.get_sentence_embedding_dimension()
            logger.info("Loaded embedding model %s (dim=%d, device=%s)", self.model_name, self._dim, self.device)
        except Exception as exc:
            logger.error("Failed to load embedding model: %s", exc)
            raise

    @property
    def dimension(self) -> int:
        if self._dim is None:
            self._load()
        return self._dim  # type: ignore

    def embed_documents(self, chunks: list[Chunk]) -> list[Chunk]:
        """Embed chunk content and attach vectors in-place (returns new Chunk objects)."""
        self._load()
        texts = [c.content for c in chunks]
        vectors = self._encode(texts, is_query=False)
        return [
            c.model_copy(update={"embedding": vectors[i].tolist()})
            for i, c in enumerate(chunks)
        ]

    def embed_query(self, query: str) -> list[float]:
        """Embed a retrieval query with BGE prefix."""
        self._load()
        vecs = self._encode([query], is_query=True)
        return vecs[0].tolist()

    def embed_texts(self, texts: list[str], is_query: bool = False) -> list[list[float]]:
        self._load()
        return self._encode(texts, is_query=is_query).tolist()

    def _encode(self, texts: list[str], is_query: bool) -> "np.ndarray":
        # BGE prepends a prefix to queries only
        if is_query and "bge" in self.model_name.lower():
            texts = [_BGE_QUERY_PREFIX + t for t in texts]

        all_embeddings = []
        for i in range(0, len(texts), self.batch_size):
            batch = texts[i: i + self.batch_size]
            vecs = self._model.encode(  # type: ignore
                batch,
                batch_size=self.batch_size,
                show_progress_bar=False,
                normalize_embeddings=True,    # L2 norm → cosine similarity = dot product
            )
            all_embeddings.append(vecs)

        return np.vstack(all_embeddings) if len(all_embeddings) > 1 else all_embeddings[0]
