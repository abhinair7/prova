from pydantic_settings import BaseSettings
from pydantic import Field
from typing import Literal
import os


class Settings(BaseSettings):
    # ── App ────────────────────────────────────────────────────────────────────
    app_name: str = "Prova API"
    environment: Literal["development", "staging", "production"] = "development"
    debug: bool = False
    log_level: str = "INFO"

    # ── API Keys ───────────────────────────────────────────────────────────────
    openai_api_key: str = Field(default="", env="OPENAI_API_KEY")
    anthropic_api_key: str = Field(default="", env="ANTHROPIC_API_KEY")
    google_api_key: str = Field(default="", env="GOOGLE_API_KEY")
    cohere_api_key: str = Field(default="", env="COHERE_API_KEY")
    mistral_api_key: str = Field(default="", env="MISTRAL_API_KEY")

    # ── Vector Store ───────────────────────────────────────────────────────────
    vector_store_backend: Literal["faiss", "chroma", "pinecone"] = "faiss"
    pinecone_api_key: str = Field(default="", env="PINECONE_API_KEY")
    pinecone_environment: str = "us-east-1-aws"
    pinecone_index_name: str = "prova-main"
    faiss_index_path: str = "./data/faiss_indices"
    chroma_persist_path: str = "./data/chroma"

    # ── Embeddings ─────────────────────────────────────────────────────────────
    embedding_model: str = "BAAI/bge-large-en-v1.5"
    embedding_dim: int = 1024
    embedding_batch_size: int = 32

    # ── Reranking ──────────────────────────────────────────────────────────────
    reranker_model: str = "cross-encoder/ms-marco-MiniLM-L-6-v2"
    reranker_top_k: int = 5

    # ── Chunking ───────────────────────────────────────────────────────────────
    chunk_size: int = 512
    chunk_overlap: int = 64
    min_chunk_size: int = 100

    # ── Retrieval ──────────────────────────────────────────────────────────────
    retrieval_top_k: int = 10
    hybrid_alpha: float = 0.7     # weight for dense retrieval (1-alpha for sparse)
    multi_hop_max_depth: int = 3

    # ── Generation ─────────────────────────────────────────────────────────────
    default_llm: str = "claude-sonnet-4-6"
    max_tokens: int = 2048
    temperature: float = 0.1

    # ── Cache ──────────────────────────────────────────────────────────────────
    cache_backend: Literal["redis", "disk", "memory"] = "disk"
    redis_url: str = "redis://localhost:6379"
    cache_ttl_seconds: int = 3600
    retrieval_cache_max_size: int = 10_000

    # ── Security ───────────────────────────────────────────────────────────────
    secret_key: str = Field(default="change-me-in-production", env="SECRET_KEY")
    access_token_expire_minutes: int = 60 * 24 * 7  # 1 week

    # ── Hardware ───────────────────────────────────────────────────────────────
    device: Literal["cpu", "cuda", "mps"] = "cpu"
    num_workers: int = 4
    max_concurrent_llm_calls: int = 10

    # ── Evaluation ─────────────────────────────────────────────────────────────
    eval_min_evaluations: int = 50    # minimum before publishing to leaderboard
    eval_confidence_level: float = 0.95

    # ── PII ────────────────────────────────────────────────────────────────────
    pii_entities: list[str] = [
        "PERSON", "EMAIL_ADDRESS", "PHONE_NUMBER", "CREDIT_CARD",
        "MEDICAL_LICENSE", "US_SSN", "NRP", "LOCATION", "DATE_TIME",
        "IP_ADDRESS", "URL", "IBAN_CODE", "US_BANK_NUMBER",
    ]

    # ── Observability ──────────────────────────────────────────────────────────
    langfuse_public_key: str = Field(default="", env="LANGFUSE_PUBLIC_KEY")
    langfuse_secret_key: str = Field(default="", env="LANGFUSE_SECRET_KEY")
    langfuse_host: str = "https://cloud.langfuse.com"

    class Config:
        env_file = ".env"
        env_file_encoding = "utf-8"
        case_sensitive = False


settings = Settings()
