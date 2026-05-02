"""
Prova RAG Pipeline

Execution order for a single evaluation request:
  1. Loader         — ingest PDF/CSV/DOCX/text into raw Document objects
  2. Preprocessor   — normalize, clean, deduplicate
  3. PII Masker     — strip names, MRNs, SSNs, etc. before any external call
  4. Chunker        — semantic + recursive splitting
  5. Embedder       — dense vector representations (BGE-large-en)
  6. Vector Store   — FAISS / Chroma / Pinecone
  7. Query Reformulator — HyDE + multi-query expansion
  8. Retriever      — hybrid dense+sparse (BM25 + cosine), multi-hop
  9. Reranker       — cross-encoder (ms-marco-MiniLM-L-6-v2)
 10. Templates      — domain-specific prompt assembly
 11. Runner         — parallel multi-LLM generation with rate limiting
 12. Hallucination  — NLI-based fact verification against retrieved chunks
 13. Evaluator      — RAGAS, BERTScore, ROUGE, latency/accuracy tradeoff
 14. Cache Manager  — retrieval + generation result caching
 15. Feedback       — user votes → score updates → fine-tune signal
 16. Bias Checker   — detect demographic / domain bias in outputs
"""

from .orchestrator import PipelineOrchestrator

__all__ = ["PipelineOrchestrator"]
