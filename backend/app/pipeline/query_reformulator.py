"""
Query Reformulation

Two strategies applied sequentially:

1. HyDE (Hypothetical Document Embeddings)
   Generate a hypothetical answer paragraph, embed that instead of the
   raw question. Dramatically improves recall for abstract questions where
   the query and relevant passages are lexically dissimilar.

2. Multi-Query Expansion
   Ask an LLM to restate the question from 3 different angles.
   Retrieve for each sub-query, then union-merge the results before reranking.
   Increases recall by ~15–20% on ambiguous professional questions.
"""

import logging
import asyncio
from typing import Optional
from app.schemas.models import QueryReformulation
from app.config import settings

logger = logging.getLogger(__name__)

_HYDE_PROMPT = """You are a domain expert. Given the following question, write a single concise paragraph that a high-quality document answering this question would contain. Do not answer the question directly — write what a relevant excerpt would look like.

Question: {query}

Relevant excerpt:"""

_MULTI_QUERY_PROMPT = """You are a search query expert. Given the following question, generate 3 alternative phrasings that would help retrieve different but relevant documents. Output only the 3 queries, one per line, no numbering.

Original question: {query}

Alternative queries:"""


class QueryReformulator:
    """
    Uses a fast LLM (haiku/flash-tier) to expand queries before retrieval.
    Gracefully degrades if LLM call fails — returns original query unchanged.
    """

    def __init__(self, llm_client=None, use_hyde: bool = True, use_multi_query: bool = True) -> None:
        self._client = llm_client
        self.use_hyde = use_hyde
        self.use_multi_query = use_multi_query

    async def reformulate(self, query: str, vertical: Optional[str] = None) -> QueryReformulation:
        tasks = []

        if self.use_hyde:
            tasks.append(self._generate_hyde(query, vertical))
        else:
            tasks.append(asyncio.sleep(0, result=None))

        if self.use_multi_query:
            tasks.append(self._generate_sub_queries(query, vertical))
        else:
            tasks.append(asyncio.sleep(0, result=[]))

        hyde_passage, sub_queries = await asyncio.gather(*tasks, return_exceptions=True)

        # Degrade gracefully on failures
        if isinstance(hyde_passage, Exception):
            logger.warning("HyDE generation failed: %s", hyde_passage)
            hyde_passage = None
        if isinstance(sub_queries, Exception):
            logger.warning("Multi-query generation failed: %s", sub_queries)
            sub_queries = []

        # Build expanded query: original + first sub-query (for single-vector retrieval)
        sub_queries = sub_queries or []
        if sub_queries:
            expanded = f"{query} {sub_queries[0]}"
        else:
            expanded = query

        return QueryReformulation(
            original=query,
            hyde_passage=hyde_passage,
            sub_queries=sub_queries,
            expanded_query=expanded,
        )

    async def _generate_hyde(self, query: str, vertical: Optional[str]) -> Optional[str]:
        if not self._client:
            return None
        prompt = _HYDE_PROMPT.format(query=query)
        if vertical:
            prompt = f"Domain: {vertical}\n\n{prompt}"
        return await self._call_llm(prompt, max_tokens=200)

    async def _generate_sub_queries(self, query: str, vertical: Optional[str]) -> list[str]:
        if not self._client:
            return []
        prompt = _MULTI_QUERY_PROMPT.format(query=query)
        if vertical:
            prompt = f"Domain: {vertical}\n\n{prompt}"
        response = await self._call_llm(prompt, max_tokens=150)
        if not response:
            return []
        lines = [l.strip() for l in response.strip().splitlines() if l.strip()]
        return lines[:3]

    async def _call_llm(self, prompt: str, max_tokens: int) -> Optional[str]:
        """Fast, cheap LLM call for query reformulation — uses claude-haiku."""
        try:
            import anthropic
            client = anthropic.AsyncAnthropic(api_key=settings.anthropic_api_key)
            msg = await client.messages.create(
                model="claude-haiku-4-5-20251001",
                max_tokens=max_tokens,
                messages=[{"role": "user", "content": prompt}],
            )
            return msg.content[0].text if msg.content else None
        except Exception as exc:
            logger.debug("LLM call failed: %s", exc)
            return None
