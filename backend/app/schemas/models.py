from pydantic import BaseModel, Field
from typing import Optional, Literal, Any
from enum import Enum
import uuid
from datetime import datetime


class Vertical(str, Enum):
    HEALTHCARE = "healthcare"
    LEGAL = "legal"
    FINANCE = "finance"
    ENGINEERING = "engineering"
    ACCOUNTING = "accounting"
    MARKETING = "marketing"
    HR = "hr"
    RESEARCH = "research"


class ModelProvider(str, Enum):
    OPENAI = "openai"
    ANTHROPIC = "anthropic"
    GOOGLE = "google"
    MISTRAL = "mistral"
    COHERE = "cohere"
    META = "meta"


class Document(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    content: str
    metadata: dict[str, Any] = {}
    source: Optional[str] = None
    page: Optional[int] = None
    chunk_index: Optional[int] = None


class Chunk(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    content: str
    embedding: Optional[list[float]] = None
    metadata: dict[str, Any] = {}
    doc_id: str
    chunk_index: int
    char_start: int
    char_end: int


class PIIMaskResult(BaseModel):
    masked_text: str
    entities_found: list[dict[str, Any]]
    mask_count: int


class RetrievedChunk(BaseModel):
    chunk: Chunk
    score: float
    retrieval_method: Literal["dense", "sparse", "hybrid"]
    rerank_score: Optional[float] = None


class QueryReformulation(BaseModel):
    original: str
    hyde_passage: Optional[str] = None       # Hypothetical Document Embedding
    sub_queries: list[str] = []              # Multi-query decomposition
    expanded_query: str                       # Final query for retrieval


class LLMResponse(BaseModel):
    model: str
    provider: ModelProvider
    output: str
    prompt_tokens: int
    completion_tokens: int
    latency_ms: float
    raw_response: Optional[dict[str, Any]] = None


class HallucinationResult(BaseModel):
    is_hallucinated: bool
    confidence: float
    flagged_claims: list[str]
    supported_claims: list[str]
    hallucination_rate: float    # 0.0–1.0, lower is better


class EvaluationScores(BaseModel):
    ragas_faithfulness: float
    ragas_answer_relevancy: float
    ragas_context_precision: float
    ragas_context_recall: float
    bert_score_f1: float
    rouge_l: float
    hallucination_rate: float
    latency_ms: float
    overall: float                # weighted composite


class ModelEvalResult(BaseModel):
    model: str
    provider: ModelProvider
    vertical: Vertical
    response: LLMResponse
    retrieved_chunks: list[RetrievedChunk]
    hallucination: HallucinationResult
    scores: EvaluationScores
    pii_masked: bool
    created_at: datetime = Field(default_factory=datetime.utcnow)


class EvaluationRequest(BaseModel):
    query: str = Field(..., min_length=10, max_length=10_000)
    vertical: Vertical
    documents: Optional[list[str]] = None        # raw document texts
    models: Optional[list[str]] = None           # override which models to test
    mask_pii: bool = True
    user_id: Optional[str] = None


class EvaluationResponse(BaseModel):
    request_id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    vertical: Vertical
    query_reformulation: QueryReformulation
    results: list[ModelEvalResult]
    best_model: str
    total_latency_ms: float
    pii_entities_removed: int
    created_at: datetime = Field(default_factory=datetime.utcnow)


class VoteRequest(BaseModel):
    evaluation_id: str
    chosen_model: str
    user_id: Optional[str] = None
    vertical: Vertical
    comment: Optional[str] = None


class LeaderboardEntry(BaseModel):
    rank: int
    model: str
    provider: str
    vertical: Vertical
    overall: float
    reasoning: float
    accuracy: float
    hallucination_trust: float    # 100 - hallucination_rate * 100
    latency_p50: float
    evaluation_count: int
    confidence_interval_low: float
    confidence_interval_high: float
    trend: Literal["up", "down", "stable"]
