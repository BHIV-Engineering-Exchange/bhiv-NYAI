"""Storage backend abstraction for constitutional evidence persistence."""
from __future__ import annotations

from typing import Any, Dict, List, Optional, Protocol, runtime_checkable


@runtime_checkable
class EvidenceStorageBackend(Protocol):
    """Interface for durable evidence storage (filesystem, Redis, object store)."""

    def retrieve(self, trace_id: str) -> Optional[Dict[str, Any]]:
        ...

    def list_all(self, limit: Optional[int] = None, offset: int = 0) -> List[Dict[str, Any]]:
        ...

    def count(self) -> int:
        ...


class FileSystemBackend:
    """JSONL append-only storage via OutputBucket."""

    def __init__(self, bucket=None):
        if bucket is None:
            from tantra.output_bucket import output_bucket
            bucket = output_bucket
        self._bucket = bucket

    def retrieve(self, trace_id: str) -> Optional[Dict[str, Any]]:
        return self._bucket.retrieve(trace_id)

    def list_all(self, limit: Optional[int] = None, offset: int = 0) -> List[Dict[str, Any]]:
        return self._bucket.list_all(limit=limit, offset=offset)

    def count(self) -> int:
        return len(self._bucket.list_all())

    def retrieve_as_evidence(self, trace_id: str):
        return self._bucket.retrieve_as_evidence(trace_id)


class RedisBackend:
    """
    Future: HSET evidence:index trace_id -> line_number / payload key.
    Not implemented in Phase IV — local filesystem remains source of truth.
    """

    def retrieve(self, trace_id: str) -> Optional[Dict[str, Any]]:
        raise NotImplementedError("RedisBackend is a Phase V stub")

    def list_all(self, limit: Optional[int] = None, offset: int = 0) -> List[Dict[str, Any]]:
        raise NotImplementedError("RedisBackend is a Phase V stub")

    def count(self) -> int:
        raise NotImplementedError("RedisBackend is a Phase V stub")


class BucketProducerBackend:
    """
    Evidence reads from local OutputBucket (write-ahead outbox).
    Bucket remote is write-side only via tantra.output_bucket.store() forwarding.
    """

    def __init__(self, bucket=None):
        if bucket is None:
            from tantra.output_bucket import output_bucket
            bucket = output_bucket
        self._bucket = bucket

    def retrieve(self, trace_id: str) -> Optional[Dict[str, Any]]:
        return self._bucket.retrieve(trace_id)

    def list_all(self, limit: Optional[int] = None, offset: int = 0) -> List[Dict[str, Any]]:
        return self._bucket.list_all(limit=limit, offset=offset)

    def count(self) -> int:
        return len(self._bucket.list_all())

    def retrieve_as_evidence(self, trace_id: str):
        return self._bucket.retrieve_as_evidence(trace_id)


class ObjectStorageBackend:
    """
    Future: S3/GCS date-sharded JSONL objects with cross-region replication.
    Not implemented in Phase IV.
    """

    def retrieve(self, trace_id: str) -> Optional[Dict[str, Any]]:
        raise NotImplementedError("ObjectStorageBackend is a Phase V stub")

    def list_all(self, limit: Optional[int] = None, offset: int = 0) -> List[Dict[str, Any]]:
        raise NotImplementedError("ObjectStorageBackend is a Phase V stub")

    def count(self) -> int:
        raise NotImplementedError("ObjectStorageBackend is a Phase V stub")
