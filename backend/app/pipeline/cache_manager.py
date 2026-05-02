"""
Retrieval Cache Management

Two-level cache:
  L1 — In-memory LRU (fast, bounded by max_size)
  L2 — DiskCache or Redis (persistent across restarts)

Cache keys:
  retrieval:  hash(query + vertical + top_k)
  generation: hash(query + model + context_hash)

Cache invalidation:
  - TTL-based expiry (default 1h)
  - Manual purge per vertical on benchmark rotation
  - Version tag in key to invalidate on model/pipeline changes
"""

import hashlib
import json
import logging
import time
from collections import OrderedDict
from typing import Any, Optional
from app.config import settings

logger = logging.getLogger(__name__)

PIPELINE_VERSION = "v1.0"


def _make_key(*parts: str) -> str:
    raw = "|".join(parts) + f"|{PIPELINE_VERSION}"
    return hashlib.sha256(raw.encode()).hexdigest()[:32]


class LRUCache:
    def __init__(self, max_size: int = 1_000, ttl: int = settings.cache_ttl_seconds) -> None:
        self._cache: OrderedDict[str, tuple[Any, float]] = OrderedDict()
        self.max_size = max_size
        self.ttl = ttl

    def get(self, key: str) -> Optional[Any]:
        if key not in self._cache:
            return None
        value, ts = self._cache[key]
        if time.time() - ts > self.ttl:
            del self._cache[key]
            return None
        self._cache.move_to_end(key)
        return value

    def set(self, key: str, value: Any) -> None:
        if key in self._cache:
            self._cache.move_to_end(key)
        self._cache[key] = (value, time.time())
        if len(self._cache) > self.max_size:
            self._cache.popitem(last=False)

    def delete(self, key: str) -> None:
        self._cache.pop(key, None)

    def clear_vertical(self, vertical: str) -> int:
        keys_to_delete = [k for k in self._cache if k.startswith(f"v:{vertical}")]
        for k in keys_to_delete:
            del self._cache[k]
        return len(keys_to_delete)

    @property
    def size(self) -> int:
        return len(self._cache)


class RetrievalCacheManager:
    def __init__(self) -> None:
        self._l1 = LRUCache(max_size=settings.retrieval_cache_max_size)
        self._l2 = self._init_l2()

    def _init_l2(self):
        if settings.cache_backend == "redis":
            try:
                import redis
                client = redis.from_url(settings.redis_url, decode_responses=True)
                client.ping()
                logger.info("Redis L2 cache connected")
                return client
            except Exception as exc:
                logger.warning("Redis unavailable (%s) -- falling back to disk cache", exc)

        if settings.cache_backend in ("disk", "redis"):
            try:
                import diskcache
                cache = diskcache.Cache("./data/cache", timeout=30)
                logger.info("DiskCache L2 initialised")
                return cache
            except ImportError:
                logger.warning("diskcache not installed -- L2 cache disabled")
        return None

    def get_retrieval(self, query: str, vertical: str, top_k: int) -> Optional[list]:
        key = _make_key("retrieval", query, vertical, str(top_k))
        result = self._l1.get(key)
        if result is not None:
            return result
        if self._l2:
            try:
                raw = self._l2.get(key)
                if raw:
                    result = json.loads(raw)
                    self._l1.set(key, result)
                    return result
            except Exception:
                pass
        return None

    def set_retrieval(self, query: str, vertical: str, top_k: int, results: list) -> None:
        key = _make_key("retrieval", query, vertical, str(top_k))
        serialisable = [r.model_dump() for r in results]
        self._l1.set(key, serialisable)
        if self._l2:
            try:
                raw = json.dumps(serialisable)
                if hasattr(self._l2, "setex"):
                    self._l2.setex(key, settings.cache_ttl_seconds, raw)
                else:
                    self._l2.set(key, raw, expire=settings.cache_ttl_seconds)
            except Exception as exc:
                logger.debug("L2 cache write failed: %s", exc)

    def get_generation(self, query: str, model: str, context_hash: str) -> Optional[str]:
        key = _make_key("gen", query, model, context_hash)
        return self._l1.get(key)

    def set_generation(self, query: str, model: str, context_hash: str, text: str) -> None:
        key = _make_key("gen", query, model, context_hash)
        self._l1.set(key, text)

    def purge_vertical(self, vertical: str) -> int:
        count = self._l1.clear_vertical(vertical)
        logger.info("Purged %d cached entries for vertical=%s", count, vertical)
        return count

    @property
    def l1_size(self) -> int:
        return self._l1.size
