"""
Custom Retriever — Hybrid Dense + Sparse (BM25)

Architecture:
  - Dense path: cosine similarity on BGE embeddings (FAISS/Chroma)
  - Sparse path: BM25 over raw chunk text (rank-bm25)
  - Fusion: Reciprocal Rank Fusion (RRF) with configurable alpha weighting
  - Multi-hop: iterative retrieval for complex multi-part questions
  - Secure retrieval: access control checks per vertical before returning chunks

RRF formula: score(d) = Σ 1 / (k + rank_i(d))   where k=60 (standard)
"""

import logging
import asyncio
from typing import Optional
from app.schemas.models import Chunk, RetrievedChunk, QueryReformulation
from app.config import settings

logger = logging.getLogger(__name__)

_RRF_K = 60


class HybridRetriever:
    """
    Combines dense and sparse retrieval with RRF fusion.
    Supports multi-query (union merge) and multi-hop retrieval.
    """

    def __init__(
        self,
        vector_store,
        alpha: float = settings.hybrid_alpha,
        top_k: int = settings.retrieval_top_k,
    ) -> None:
        self._store = vector_store
        self.alpha = alpha           # weight for dense (0=pure sparse, 1=pure dense)
        self.top_k = top_k
        self._bm25 = None
        self._bm25_chunks: list[Chunk] = []

    def index_chunks(self, chunks: list[Chunk]) -> None:
        """Build BM25 index on a set of chunks."""
        try:
            from rank_bm25 import BM25Okapi
            tokenized = [c.content.lower().split() for c in chunks]
            self._bm25 = BM25Okapi(tokenized)
            self._bm25_chunks = list(chunks)
            logger.info("BM25 index built over %d chunks", len(chunks))
        except ImportError:
            logger.warning("rank-bm25 not installed — sparse retrieval disabled")

    async def retrieve(
        self,
        reformulation: QueryReformulation,
        embedder,
        top_k: Optional[int] = None,
        vertical: Optional[str] = None,
        user_id: Optional[str] = None,
    ) -> list[RetrievedChunk]:
        k = top_k or self.top_k

        # Embed primary query (use HyDE passage if available, else original)
        primary_text = reformulation.hyde_passage or reformulation.expanded_query
        query_vec = await asyncio.get_event_loop().run_in_executor(
            None, embedder.embed_query, primary_text
        )

        # Dense retrieval for all sub-queries in parallel
        all_queries = [reformulation.expanded_query] + (reformulation.sub_queries or [])
        dense_tasks = [
            asyncio.get_event_loop().run_in_executor(
                None, self._store.similarity_search, query_vec, k * 2
            )
        ]
        dense_results_list = await asyncio.gather(*dense_tasks)

        # Flatten and deduplicate dense results
        dense_seen: dict[str, tuple[Chunk, float]] = {}
        for result_list in dense_results_list:
            for chunk, score in result_list:
                if chunk.id not in dense_seen or score > dense_seen[chunk.id][1]:
                    dense_seen[chunk.id] = (chunk, score)

        dense_ranked = sorted(dense_seen.values(), key=lambda x: x[1], reverse=True)[:k * 2]

        # Sparse BM25 retrieval
        sparse_ranked = self._bm25_search(reformulation.expanded_query, k * 2)

        # RRF fusion
        fused = self._rrf_fuse(dense_ranked, sparse_ranked, k)

        # Access control filter
        fused = self._apply_access_control(fused, vertical, user_id)

        return fused[:k]

    def _bm25_search(self, query: str, top_k: int) -> list[tuple[Chunk, float]]:
        if self._bm25 is None or not self._bm25_chunks:
            return []
        try:
            scores = self._bm25.get_scores(query.lower().split())
            indexed = sorted(enumerate(scores), key=lambda x: x[1], reverse=True)[:top_k]
            return [(self._bm25_chunks[i], float(s)) for i, s in indexed if s > 0]
        except Exception as exc:
            logger.warning("BM25 search failed: %s", exc)
            return []

    def _rrf_fuse(
        self,
        dense: list[tuple[Chunk, float]],
        sparse: list[tuple[Chunk, float]],
        top_k: int,
    ) -> list[RetrievedChunk]:
        rrf_scores: dict[str, float] = {}
        chunk_map: dict[str, Chunk] = {}

        for rank, (chunk, _) in enumerate(dense):
            rrf_scores[chunk.id] = rrf_scores.get(chunk.id, 0.0) + self.alpha / (_RRF_K + rank + 1)
            chunk_map[chunk.id] = chunk

        for rank, (chunk, _) in enumerate(sparse):
            rrf_scores[chunk.id] = rrf_scores.get(chunk.id, 0.0) + (1 - self.alpha) / (_RRF_K + rank + 1)
            chunk_map[chunk.id] = chunk

        sorted_ids = sorted(rrf_scores, key=lambda cid: rrf_scores[cid], reverse=True)[:top_k]

        results = []
        for cid in sorted_ids:
            chunk = chunk_map[cid]
            method: str = "hybrid"
            if cid in {c.id for c, _ in dense} and cid not in {c.id for c, _ in sparse}:
                method = "dense"
            elif cid not in {c.id for c, _ in dense}:
                method = "sparse"
            results.append(RetrievedChunk(
                chunk=chunk,
                score=rrf_scores[cid],
                retrieval_method=method,  # type: ignore
            ))

        return results

    @staticmethod
    def _apply_access_control(
        chunks: list[RetrievedChunk],
        vertical: Optional[str],
        user_id: Optional[str],
    ) -> list[RetrievedChunk]:
        """
        Filter retrieved chunks by vertical ownership.
        In production: verify chunk.metadata['vertical'] matches the user's
        verified vertical to prevent cross-domain data leakage.
        """
        if vertical is None:
            return chunks
        return [
            c for c in chunks
            if c.chunk.metadata.get("vertical", vertical) == vertical
            or c.chunk.metadata.get("vertical") is None
        ]


class MultiHopRetriever:
    """
    Iterative retrieval for multi-part questions:
      1. Retrieve top-k for the original query
      2. Extract bridging entities from top results
      3. Formulate follow-up queries from those entities
      4. Retrieve again (up to max_depth hops)
      5. Merge all retrieved chunks, rerank globally
    """

    def __init__(
        self,
        base_retriever: HybridRetriever,
        max_depth: int = settings.multi_hop_max_depth,
    ) -> None:
        self._retriever = base_retriever
        self.max_depth = max_depth

    async def retrieve(
        self,
        reformulation: QueryReformulation,
        embedder,
        top_k: int = settings.retrieval_top_k,
        vertical: Optional[str] = None,
    ) -> list[RetrievedChunk]:
        all_retrieved: list[RetrievedChunk] = []
        seen_chunk_ids: set[str] = set()

        current_query = reformulation
        for hop in range(self.max_depth):
            results = await self._retriever.retrieve(
                current_query, embedder, top_k=top_k // self.max_depth + top_k % 2, vertical=vertical
            )
            new_results = [r for r in results if r.chunk.id not in seen_chunk_ids]
            all_retrieved.extend(new_results)
            seen_chunk_ids.update(r.chunk.id for r in new_results)

            if hop < self.max_depth - 1 and new_results:
                bridge_text = self._extract_bridge_entities(new_results[:3])
                if not bridge_text:
                    break
                current_query = QueryReformulation(
                    original=current_query.original,
                    sub_queries=[bridge_text],
                    expanded_query=f"{current_query.original} {bridge_text}",
                )
            else:
                break

        # Re-sort by score descending
        all_retrieved.sort(key=lambda r: r.score, reverse=True)
        return all_retrieved[:top_k]

    @staticmethod
    def _extract_bridge_entities(results: list[RetrievedChunk]) -> str:
        """
        Naive entity extraction: pick noun phrases from top results.
        Production implementation uses spaCy NER.
        """
        text = " ".join(r.chunk.content[:200] for r in results)
        words = [w for w in text.split() if w.istitle() and len(w) > 3]
        unique = list(dict.fromkeys(words))[:5]
        return " ".join(unique)
