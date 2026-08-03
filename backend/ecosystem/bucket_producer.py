"""
Bucket producer client — NYAI → Siddhesh Bucket append-only truth store.

Contract: POST /bucket/artifact (singular), envelope per append_only_storage.py.
Feature-flagged: BUCKET_PRODUCER_ENABLED defaults to false.
Fail-closed toward Bucket with local outbox fallback (output_logs/bucket_outbox.jsonl).
"""
from __future__ import annotations

import json
import logging
import os
import threading
import time
import urllib.error
import urllib.request
from datetime import datetime, timezone
from typing import Any, Dict, List, Optional
from uuid import uuid4

logger = logging.getLogger("nyai.ecosystem.bucket")

TRACE_HEADER = "X-Trace-Id"
SCHEMA_VERSION = "1.0.0"
DEFAULT_SOURCE_MODULE = "nyai.legal_query"
DEFAULT_ARTIFACT_TYPE = "legal_query_evidence"
MAX_LINEAGE_RETRIES = 5
LINEAGE_BACKOFF_SECONDS = 0.05


def _utc_now_iso() -> str:
    return datetime.now(timezone.utc).strftime("%Y-%m-%dT%H:%M:%SZ")


def is_bucket_producer_enabled() -> bool:
    return os.environ.get("BUCKET_PRODUCER_ENABLED", "false").lower() in {
        "1", "true", "yes",
    }


def _bucket_endpoint() -> str:
    return os.environ.get(
        "BUCKET_ENDPOINT",
        "https://bhiv-bucket-i1l6.onrender.com",
    ).rstrip("/")


def _outbox_path() -> str:
    base = os.environ.get("OUTPUT_DIRECTORY", "").strip()
    if not base:
        base = os.path.join(
            os.path.dirname(os.path.abspath(__file__)),
            "..",
            "output_logs",
        )
    return os.path.join(base, "bucket_outbox.jsonl")


class BucketProducerError(Exception):
    """Raised when a Bucket publish cannot be completed after retries."""


class BucketProducerClient:
    """HTTP client for NYAI evidence publishing to Bucket."""

    def __init__(
        self,
        endpoint: Optional[str] = None,
        timeout_seconds: float = 30.0,
    ) -> None:
        self.endpoint = (endpoint or _bucket_endpoint()).rstrip("/")
        self.timeout_seconds = timeout_seconds
        self._lock = threading.Lock()

    def _request(
        self,
        method: str,
        path: str,
        *,
        body: Optional[Dict[str, Any]] = None,
        trace_id: Optional[str] = None,
    ) -> Dict[str, Any]:
        url = f"{self.endpoint}{path}"
        headers = {"Content-Type": "application/json", "Accept": "application/json"}
        if trace_id:
            headers[TRACE_HEADER] = trace_id
        data = json.dumps(body).encode("utf-8") if body is not None else None
        req = urllib.request.Request(url, data=data, headers=headers, method=method)
        try:
            with urllib.request.urlopen(req, timeout=self.timeout_seconds) as resp:
                raw = resp.read().decode("utf-8")
                return json.loads(raw) if raw else {}
        except urllib.error.HTTPError as exc:
            detail = exc.read().decode("utf-8", errors="replace")
            raise BucketProducerError(
                f"HTTP {exc.code} from {path}: {detail[:500]}"
            ) from exc
        except urllib.error.URLError as exc:
            raise ConnectionError(f"Bucket unreachable at {url}: {exc}") from exc

    def health(self) -> Dict[str, Any]:
        return self._request("GET", "/health")

    def get_chain_state(self) -> Dict[str, Any]:
        response = self._request("GET", "/bucket/chain-state")
        chain_state = response.get("chain_state") or response
        return {
            "last_hash": chain_state.get("last_hash"),
            "artifact_count": chain_state.get("artifact_count", 0),
        }

    def _build_envelope(
        self,
        nyai_evidence_record: Dict[str, Any],
        *,
        parent_hash: Optional[str],
        source_module_id: str = DEFAULT_SOURCE_MODULE,
        artifact_type: str = DEFAULT_ARTIFACT_TYPE,
    ) -> Dict[str, Any]:
        trace_id = nyai_evidence_record.get("trace_id") or "UNKNOWN"
        timestamp = nyai_evidence_record.get("timestamp") or _utc_now_iso()
        envelope: Dict[str, Any] = {
            "artifact_id": f"nyai-{uuid4()}",
            "trace_id": trace_id,
            "timestamp_utc": timestamp,
            "schema_version": SCHEMA_VERSION,
            "source_module_id": source_module_id,
            "artifact_type": artifact_type,
            "payload": nyai_evidence_record,
        }
        if parent_hash:
            envelope["parent_hash"] = parent_hash
        return envelope

    def _is_lineage_conflict(self, exc: BucketProducerError) -> bool:
        message = str(exc).lower()
        return "parent_hash" in message or "lineage" in message or "invalid parent" in message

    def publish(
        self,
        nyai_evidence_record: Dict[str, Any],
        *,
        source_module_id: str = DEFAULT_SOURCE_MODULE,
        artifact_type: str = DEFAULT_ARTIFACT_TYPE,
    ) -> Dict[str, Any]:
        """Publish evidence envelope; retry on lineage conflict."""
        trace_id = nyai_evidence_record.get("trace_id")
        last_exc: Optional[Exception] = None

        for attempt in range(MAX_LINEAGE_RETRIES):
            chain = self.get_chain_state()
            parent_hash = chain.get("last_hash")
            if chain.get("artifact_count", 0) == 0:
                parent_hash = None
            envelope = self._build_envelope(
                nyai_evidence_record,
                parent_hash=parent_hash,
                source_module_id=source_module_id,
                artifact_type=artifact_type,
            )
            try:
                result = self._request(
                    "POST",
                    "/bucket/artifact",
                    body=envelope,
                    trace_id=trace_id,
                )
                verified = self._verify_publish(envelope, result, trace_id)
                return {
                    "artifact_id": result.get("artifact_id") or envelope["artifact_id"],
                    "hash": result.get("hash") or verified.get("hash"),
                    "trace_id": trace_id,
                    "verified": True,
                }
            except BucketProducerError as exc:
                last_exc = exc
                if self._is_lineage_conflict(exc) and attempt < MAX_LINEAGE_RETRIES - 1:
                    time.sleep(LINEAGE_BACKOFF_SECONDS * (attempt + 1))
                    continue
                raise
            except ConnectionError:
                raise

        raise BucketProducerError(f"Bucket publish failed after retries: {last_exc}")

    def _verify_publish(
        self,
        envelope: Dict[str, Any],
        write_result: Dict[str, Any],
        original_trace_id: Optional[str],
    ) -> Dict[str, Any]:
        artifact_id = write_result.get("artifact_id") or envelope["artifact_id"]
        stored = self.read(artifact_id)
        artifact = stored.get("artifact") or stored
        stored_hash = stored.get("hash") or artifact.get("hash")
        expected_hash = write_result.get("hash")
        if expected_hash and stored_hash and stored_hash != expected_hash:
            raise BucketProducerError(
                f"Post-write hash mismatch for {artifact_id}"
            )
        if original_trace_id and artifact.get("trace_id") != original_trace_id:
            raise BucketProducerError(
                f"Post-write trace_id mismatch for {artifact_id}"
            )
        return {"hash": stored_hash, "artifact": artifact}

    def read(self, artifact_id: str) -> Dict[str, Any]:
        return self._request("GET", f"/bucket/artifact/{artifact_id}")

    def query_by_trace(self, trace_id: str) -> List[Dict[str, Any]]:
        url_path = f"/bucket/artifacts?trace_id={urllib.request.quote(trace_id, safe='')}"
        response = self._request("GET", url_path, trace_id=trace_id)
        return response.get("artifacts") or []

    def verify_chain(self) -> Dict[str, Any]:
        return self._request("POST", "/bucket/validate-replay")


_client: Optional[BucketProducerClient] = None
_client_lock = threading.Lock()
_outbox_lock = threading.Lock()


def get_bucket_producer_client() -> BucketProducerClient:
    global _client
    with _client_lock:
        if _client is None:
            _client = BucketProducerClient()
        return _client


def _append_outbox(envelope: Dict[str, Any], error: str) -> None:
    path = _outbox_path()
    os.makedirs(os.path.dirname(path), exist_ok=True)
    record = {
        "queued_at": _utc_now_iso(),
        "error": error[:500],
        "envelope": envelope,
    }
    with _outbox_lock:
        with open(path, "a", encoding="utf-8") as handle:
            handle.write(json.dumps(record, sort_keys=True, default=str) + "\n")


def forward_evidence_to_bucket(
    nyai_evidence_record: Dict[str, Any],
    *,
    source_module_id: str = DEFAULT_SOURCE_MODULE,
    artifact_type: str = DEFAULT_ARTIFACT_TYPE,
) -> Optional[Dict[str, Any]]:
    """
    Fire-and-forget Bucket forward after local outbox write.
    On failure, queue envelope to bucket_outbox.jsonl (fail-closed locally).
    """
    if not is_bucket_producer_enabled():
        return None

    client = get_bucket_producer_client()
    try:
        return client.publish(
            nyai_evidence_record,
            source_module_id=source_module_id,
            artifact_type=artifact_type,
        )
    except (BucketProducerError, ConnectionError) as exc:
        logger.warning("Bucket publish failed, writing to local outbox: %s", exc)
        chain = {}
        try:
            chain = client.get_chain_state()
        except Exception:
            pass
        envelope = client._build_envelope(
            nyai_evidence_record,
            parent_hash=chain.get("last_hash"),
            source_module_id=source_module_id,
            artifact_type=artifact_type,
        )
        _append_outbox(envelope, str(exc))
        return None


def recover_bucket_outbox() -> None:
    """
    Reads the bucket outbox file and retries publishing queued envelopes.
    """
    if not is_bucket_producer_enabled():
        return

    path = _outbox_path()
    if not os.path.exists(path):
        return

    temp_path = path + ".recovery.tmp"
    try:
        with _outbox_lock:
            if os.path.exists(path):
                os.rename(path, temp_path)
    except Exception as e:
        logger.error("Failed to rename outbox for recovery: %s", e)
        return

    if not os.path.exists(temp_path):
        return

    failed_records = []
    client = get_bucket_producer_client()

    with open(temp_path, "r", encoding="utf-8") as f:
        for line in f:
            line = line.strip()
            if not line:
                continue
            try:
                record = json.loads(line)
                envelope = record.get("envelope")
                if not envelope or "payload" not in envelope:
                    continue

                try:
                    client.publish(
                        envelope["payload"],
                        source_module_id=envelope.get("source_module_id", DEFAULT_SOURCE_MODULE),
                        artifact_type=envelope.get("artifact_type", DEFAULT_ARTIFACT_TYPE),
                    )
                except Exception as exc:
                    logger.warning("Bucket outbox recovery retry failed: %s", exc)
                    failed_records.append(record)
            except Exception as parse_exc:
                logger.error("Outbox recovery parse error: %s", parse_exc)

    try:
        os.remove(temp_path)
    except Exception:
        pass

    if failed_records:
        os.makedirs(os.path.dirname(path), exist_ok=True)
        with _outbox_lock:
            with open(path, "a", encoding="utf-8") as handle:
                for record in failed_records:
                    handle.write(json.dumps(record, sort_keys=True, default=str) + "\n")

