"""
Vector Store — FAISS (default), Chroma, Pinecone

Abstracted behind a VectorStore protocol so the backend can be swapped
without touching retrieval code. All stores support:
  - add_chunks(chunks)
  - similarity_search(query_vector, top_k) → list[ScoredChunk]
  - delete_by_doc_id(doc_id)
  - persist() / load()
"""

import logging
import json
import os
import numpy as np
from typing import Optional, Protocol, runtime_checkable
from app.schemas.models import Chunk, RetrievedChunk
from app.config import settings

logger = logging.getLogger(__name__)

ScoredChunk = tuple[Chunk, float]   # (chunk, similarity_score)


@runtime_checkable
class VectorStoreProtocol(Protocol):
    def add_chunks(self, chunks: list[Chunk]) -> None: ...
    def similarity_search(self, query_vector: list[float], top_k: int) -> list[ScoredChunk]: ...
    def delete_by_doc_id(self, doc_id: str) -> None: ...
    def count(self) -> int: ...


# ── FAISS ─────────────────────────────────────────────────────────────────────

class FAISSVectorStore:
    """
    In-process FAISS flat index with a companion metadata store.
    Suitable for < 10M chunks; beyond that, use IVF or HNSW indexes.
    """

    def __init__(self, dimension: int, index_path: Optional[str] = None) -> None:
        self.dimension = dimension
        self.index_path = index_path or settings.faiss_index_path
        self._index = None
        self._chunks: list[Chunk] = []   # parallel list with FAISS internal IDs
        self._doc_id_to_indices: dict[str, list[int]] = {}
        self._build_index()

    def _build_index(self) -> None:
        try:
            import faiss
            self._index = faiss.IndexFlatIP(self.dimension)   # Inner Product (works for L2-normalised vectors)
            logger.info("FAISS IndexFlatIP built (dim=%d)", self.dimension)
        except ImportError:
            logger.error("faiss-cpu not installed — pip install faiss-cpu")
            raise

    def add_chunks(self, chunks: list[Chunk]) -> None:
        if not chunks:
            return
        import faiss
        vectors = np.array([c.embedding for c in chunks], dtype="float32")
        start_id = len(self._chunks)
        self._index.add(vectors)  # type: ignore
        for i, chunk in enumerate(chunks):
            idx = start_id + i
            self._chunks.append(chunk)
            self._doc_id_to_indices.setdefault(chunk.doc_id, []).append(idx)
        logger.debug("Added %d chunks to FAISS (total=%d)", len(chunks), len(self._chunks))

    def similarity_search(self, query_vector: list[float], top_k: int = 10) -> list[ScoredChunk]:
        if len(self._chunks) == 0:
            return []
        q = np.array([query_vector], dtype="float32")
        scores, indices = self._index.search(q, min(top_k, len(self._chunks)))  # type: ignore
        results = []
        for score, idx in zip(scores[0], indices[0]):
            if idx < 0:
                continue
            results.append((self._chunks[idx], float(score)))
        return results

    def delete_by_doc_id(self, doc_id: str) -> None:
        # FAISS flat indexes don't support deletion — mark as tombstoned
        # For production, use IDMap2 index or periodic re-indexing
        indices = self._doc_id_to_indices.pop(doc_id, [])
        for idx in indices:
            self._chunks[idx] = self._chunks[idx].model_copy(
                update={"metadata": {**self._chunks[idx].metadata, "deleted": True}}
            )
        logger.info("Tombstoned %d chunks for doc_id=%s", len(indices), doc_id)

    def count(self) -> int:
        return len(self._chunks)

    def persist(self) -> None:
        import faiss
        os.makedirs(self.index_path, exist_ok=True)
        faiss.write_index(self._index, os.path.join(self.index_path, "index.faiss"))  # type: ignore
        with open(os.path.join(self.index_path, "chunks.json"), "w") as f:
            json.dump([c.model_dump() for c in self._chunks], f)
        logger.info("FAISS index persisted to %s", self.index_path)

    def load(self) -> bool:
        import faiss
        idx_path = os.path.join(self.index_path, "index.faiss")
        meta_path = os.path.join(self.index_path, "chunks.json")
        if not (os.path.exists(idx_path) and os.path.exists(meta_path)):
            return False
        self._index = faiss.read_index(idx_path)
        with open(meta_path) as f:
            self._chunks = [Chunk(**c) for c in json.load(f)]
        logger.info("Loaded FAISS index with %d chunks", len(self._chunks))
        return True


# ── Chroma ─────────────────────────────────────────────────────────────────────

class ChromaVectorStore:
    """Persistent Chroma store — good for development and small production workloads."""

    def __init__(self, collection_name: str = "prova", persist_path: str = settings.chroma_persist_path) -> None:
        try:
            import chromadb
            self._client = chromadb.PersistentClient(path=persist_path)
            self._collection = self._client.get_or_create_collection(
                name=collection_name,
                metadata={"hnsw:space": "cosine"},
            )
            logger.info("Chroma collection '%s' ready", collection_name)
        except ImportError:
            logger.error("chromadb not installed — pip install chromadb")
            raise

    def add_chunks(self, chunks: list[Chunk]) -> None:
        if not chunks:
            return
        self._collection.add(
            ids=[c.id for c in chunks],
            embeddings=[c.embedding for c in chunks],
            documents=[c.content for c in chunks],
            metadatas=[{**c.metadata, "doc_id": c.doc_id, "chunk_index": c.chunk_index} for c in chunks],
        )

    def similarity_search(self, query_vector: list[float], top_k: int = 10) -> list[ScoredChunk]:
        results = self._collection.query(
            query_embeddings=[query_vector],
            n_results=min(top_k, self._collection.count() or 1),
            include=["documents", "distances", "metadatas"],
        )
        pairs = []
        for doc, dist, meta in zip(
            results["documents"][0],
            results["distances"][0],
            results["metadatas"][0],
        ):
            chunk = Chunk(
                content=doc,
                doc_id=meta.get("doc_id", ""),
                chunk_index=meta.get("chunk_index", 0),
                char_start=0,
                char_end=len(doc),
                metadata=meta,
            )
            pairs.append((chunk, 1.0 - dist))   # cosine distance → similarity
        return pairs

    def delete_by_doc_id(self, doc_id: str) -> None:
        results = self._collection.get(where={"doc_id": doc_id})
        if results["ids"]:
            self._collection.delete(ids=results["ids"])

    def count(self) -> int:
        return self._collection.count()


# ── Factory ─────────────────────────────────────────────────────────────────────

def create_vector_store(dimension: int) -> VectorStoreProtocol:
    backend = settings.vector_store_backend
    if backend == "faiss":
        return FAISSVectorStore(dimension=dimension)
    elif backend == "chroma":
        return ChromaVectorStore()
    elif backend == "pinecone":
        # Pinecone requires an API key — wired but not primary for OSS deployments
        raise NotImplementedError("Pinecone support — configure PINECONE_API_KEY and run pinecone init")
    else:
        raise ValueError(f"Unknown vector store backend: {backend}")
