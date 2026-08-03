"""
InsightFlow dataset registry publisher — fail-open, feature-gated (Phase VI Section 4.3).

Registers NYAI runtime dataset metadata; attaches trace_id in extended_metadata.
Does NOT hardcode API keys from TANTRA_INTEGRATION_REGISTRY.json.
"""
from __future__ import annotations

import json
import logging
import os
import threading
import urllib.error
import urllib.request
from datetime import datetime, timezone
from typing import Any, Dict, Optional

logger = logging.getLogger("nyai.ecosystem.insightflow")

TRACE_HEADER = "X-Trace-Id"
DATASET_CANONICAL_ID = "nyai.legal_query_runtime"
_local_log_lock = threading.Lock()
_dataset_registered = False
_dataset_id: Optional[str] = None
_register_lock = threading.Lock()


class InsightFlowHTTPError(ConnectionError):
    """HTTP error preserving upstream status code."""

    def __init__(self, status_code: int, detail: str) -> None:
        super().__init__(f"InsightFlow HTTP {status_code}: {detail[:300]}")
        self.status_code = status_code
        self.detail = detail


def is_insightflow_enabled() -> bool:
    return os.environ.get("INSIGHTFLOW_ENABLED", "false").lower() in {
        "1", "true", "yes",
    }


def _endpoint() -> str:
    return os.environ.get("INSIGHTFLOW_ENDPOINT", "").rstrip("/")


def _api_key() -> str:
    return os.environ.get("INSIGHTFLOW_API_KEY", "").strip()


def _local_fallback_path() -> str:
    base = os.environ.get("OUTPUT_DIRECTORY", "").strip()
    if not base:
        base = os.path.join(
            os.path.dirname(os.path.abspath(__file__)),
            "..",
            "output_logs",
        )
    return os.path.join(base, "insightflow_traces.jsonl")


def _utc_now_iso() -> str:
    return datetime.now(timezone.utc).strftime("%Y-%m-%dT%H:%M:%SZ")


def _append_local_fallback(record: Dict[str, Any]) -> None:
    path = _local_fallback_path()
    os.makedirs(os.path.dirname(path), exist_ok=True)
    with _local_log_lock:
        with open(path, "a", encoding="utf-8") as handle:
            handle.write(json.dumps(record, sort_keys=True, default=str) + "\n")


def _request(
    method: str,
    path: str,
    *,
    body: Optional[Dict[str, Any]] = None,
    trace_id: Optional[str] = None,
) -> Dict[str, Any]:
    endpoint = _endpoint()
    api_key = _api_key()
    if not endpoint or not api_key:
        raise ConnectionError("InsightFlow endpoint or API key not configured")

    url = f"{endpoint}{path}"
    headers = {
        "Content-Type": "application/json",
        "Accept": "application/json",
        "X-API-Key": api_key,
    }
    if trace_id:
        headers[TRACE_HEADER] = trace_id
    data = json.dumps(body).encode("utf-8") if body is not None else None
    req = urllib.request.Request(url, data=data, headers=headers, method=method)
    try:
        with urllib.request.urlopen(req, timeout=15) as resp:
            raw = resp.read().decode("utf-8")
            return json.loads(raw) if raw else {}
    except urllib.error.HTTPError as exc:
        detail = exc.read().decode("utf-8", errors="replace")
        raise InsightFlowHTTPError(exc.code, detail) from exc
    except urllib.error.URLError as exc:
        raise ConnectionError(f"InsightFlow unreachable: {exc}") from exc


def _extract_dataset_id(payload: Dict[str, Any]) -> Optional[str]:
    raw = payload.get("id")
    return str(raw) if raw else None


def _lookup_dataset_id_by_canonical_id(trace_id: Optional[str] = None) -> Optional[str]:
    response = _request(
        "GET",
        f"/api/v1/datasets/canonical/{DATASET_CANONICAL_ID}",
        trace_id=trace_id,
    )
    return _extract_dataset_id(response)


def register_dataset_if_needed(trace_id: Optional[str] = None) -> Optional[str]:
    """Register NYAI dataset entry once per process (fail-open)."""
    global _dataset_registered, _dataset_id
    if not is_insightflow_enabled():
        return None
    with _register_lock:
        if _dataset_registered and _dataset_id:
            return _dataset_id
        payload = {
            "canonical_id": DATASET_CANONICAL_ID,
            "dataset_name": "NYAI Legal Query Runtime",
            "description": "Advisory legal query execution telemetry from NYAI",
            "owner_name": "Shashank",
            "owner_team": "NYAI",
            "domain_primary": "legal_ai",
            "source_system": "nyai",
            "domain_tags": ["legal", "advisory", "tantra"],
            "extended_metadata": {
                "trace_id": trace_id or "startup",
                "registered_at": _utc_now_iso(),
            },
        }
        try:
            response = _request("POST", "/api/v1/datasets/", body=payload, trace_id=trace_id)
            _dataset_id = _extract_dataset_id(response)
            _dataset_registered = True
            return _dataset_id
        except InsightFlowHTTPError as exc:
            if exc.status_code == 409:
                try:
                    _dataset_id = _lookup_dataset_id_by_canonical_id(trace_id=trace_id)
                    _dataset_registered = _dataset_id is not None
                    if _dataset_registered:
                        return _dataset_id
                except Exception as lookup_exc:
                    logger.warning(
                        "InsightFlow canonical lookup failed after 409 (fail-open): %s",
                        lookup_exc,
                    )
                    _append_local_fallback(
                        {
                            "type": "dataset_lookup",
                            "canonical_id": DATASET_CANONICAL_ID,
                            "error": str(lookup_exc),
                        }
                    )
            logger.warning("InsightFlow dataset registration failed (fail-open): %s", exc)
            _append_local_fallback({"type": "dataset_registration", "payload": payload, "error": str(exc)})
            return None
        except Exception as exc:
            logger.warning("InsightFlow dataset registration failed (fail-open): %s", exc)
            _append_local_fallback({"type": "dataset_registration", "payload": payload, "error": str(exc)})
            return None


def publish_query_telemetry(query_response: Dict[str, Any]) -> None:
    """Fire-and-forget telemetry publish after /nyaya/query (fail-open)."""
    if not is_insightflow_enabled():
        return

    trace_id = query_response.get("trace_id")
    dataset_id = register_dataset_if_needed(trace_id=trace_id)
    if not dataset_id:
        _append_local_fallback(
            {
                "type": "query_telemetry",
                "payload": {"trace_id": trace_id},
                "error": "dataset_id unavailable",
            }
        )
        return

    snapshot: Dict[str, Any] = {}
    try:
        from api.metrics import metrics_store

        snapshot = metrics_store.snapshot()
    except Exception:
        pass

    record = {
        "event_type": "VALIDATION",
        "recorded_by": "NYAI",
        "source_system": "nyai",
        "source_reference": trace_id,
        "ingestion_pipeline": "nyai.query_runtime",
        "notes": "NYAI legal query telemetry event",
        "is_replay_safe": True,
        "replay_context": {
            "metrics_snapshot": snapshot,
            "jurisdiction": query_response.get("jurisdiction"),
            "domain": query_response.get("domain"),
            "trace_id": trace_id,
            "published_at": _utc_now_iso(),
        },
    }

    try:
        _request("POST", f"/api/v1/datasets/{dataset_id}/provenance", body=record, trace_id=trace_id)
    except Exception as exc:
        logger.warning("InsightFlow telemetry publish failed (fail-open): %s", exc)
        _append_local_fallback({"type": "query_telemetry", "payload": record, "error": str(exc)})


def health_check() -> Dict[str, str]:
    if not is_insightflow_enabled():
        return {"status": "DISABLED", "detail": "INSIGHTFLOW_ENABLED=false"}
    try:
        _request("GET", "/health")
        return {"status": "PASS", "detail": "InsightFlow reachable"}
    except Exception as exc:
        return {"status": "DEGRADED", "detail": str(exc)[:200]}


def recover_insightflow_outbox() -> None:
    """
    Reads the InsightFlow fallback outbox and retries publishing queued events.
    """
    if not is_insightflow_enabled():
        return

    path = _local_fallback_path()
    if not os.path.exists(path):
        return

    temp_path = path + ".recovery.tmp"
    try:
        with _local_log_lock:
            if os.path.exists(path):
                os.rename(path, temp_path)
    except Exception as e:
        logger.error("Failed to rename InsightFlow outbox for recovery: %s", e)
        return

    if not os.path.exists(temp_path):
        return

    failed_records = []
    dataset_id = register_dataset_if_needed()

    with open(temp_path, "r", encoding="utf-8") as f:
        for line in f:
            line = line.strip()
            if not line:
                continue
            try:
                record = json.loads(line)
                rec_type = record.get("type")
                payload = record.get("payload")

                if not payload:
                    continue

                if rec_type == "dataset_registration":
                    try:
                        _dataset_id = register_dataset_if_needed()
                        if not _dataset_id:
                            failed_records.append(record)
                    except Exception as exc:
                        logger.warning("InsightFlow dataset registration recovery failed: %s", exc)
                        failed_records.append(record)

                elif rec_type == "query_telemetry":
                    if not dataset_id:
                        dataset_id = register_dataset_if_needed()

                    if not dataset_id:
                        failed_records.append(record)
                        continue

                    trace_id = payload.get("source_reference") or payload.get("replay_context", {}).get("trace_id")
                    try:
                        _request("POST", f"/api/v1/datasets/{dataset_id}/provenance", body=payload, trace_id=trace_id)
                    except Exception as exc:
                        logger.warning("InsightFlow telemetry publish recovery failed: %s", exc)
                        failed_records.append(record)
            except Exception as parse_exc:
                logger.error("InsightFlow outbox recovery parse error: %s", parse_exc)

    try:
        os.remove(temp_path)
    except Exception:
        pass

    if failed_records:
        os.makedirs(os.path.dirname(path), exist_ok=True)
        with _local_log_lock:
            with open(path, "a", encoding="utf-8") as handle:
                for record in failed_records:
                    handle.write(json.dumps(record, sort_keys=True, default=str) + "\n")

