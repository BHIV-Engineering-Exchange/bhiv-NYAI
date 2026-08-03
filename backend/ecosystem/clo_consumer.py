"""
CLO consumer client (Phase VI) — governed, read-only, feature-gated.
"""
from __future__ import annotations

import json
import os
import urllib.error
import urllib.parse
import urllib.request
from typing import Any, Dict, List, Optional


def is_clo_enabled() -> bool:
    return os.environ.get("CLO_ENABLED", "false").lower() in {"1", "true", "yes"}


def is_clo_sync_enabled() -> bool:
    return os.environ.get("CLO_SYNC_ENABLED", "false").lower() in {"1", "true", "yes"}


def _endpoint() -> str:
    return os.environ.get("CLO_ENDPOINT", "").rstrip("/")


class CLOConsumerClient:
    """Read-only client for GC-Shakti governed CLO routes."""

    def __init__(self, endpoint: Optional[str] = None, timeout_seconds: float = 15.0) -> None:
        self.endpoint = (endpoint or _endpoint()).rstrip("/")
        self.timeout_seconds = timeout_seconds

    def _request(self, method: str, path: str, body: Optional[Dict[str, Any]] = None) -> Dict[str, Any]:
        if not self.endpoint:
            raise ConnectionError("CLO endpoint not configured")
        url = f"{self.endpoint}{path}"
        payload = json.dumps(body).encode("utf-8") if body is not None else None
        req = urllib.request.Request(
            url,
            data=payload,
            headers={"Accept": "application/json", "Content-Type": "application/json"},
            method=method,
        )
        try:
            with urllib.request.urlopen(req, timeout=self.timeout_seconds) as resp:
                raw = resp.read().decode("utf-8")
                return json.loads(raw) if raw else {}
        except urllib.error.HTTPError as exc:
            detail = exc.read().decode("utf-8", errors="replace")
            raise ConnectionError(f"CLO HTTP {exc.code}: {detail[:300]}") from exc
        except urllib.error.URLError as exc:
            raise ConnectionError(f"CLO unreachable: {exc}") from exc

    # Allowed routes only.
    def status(self) -> Dict[str, Any]:
        return self._request("GET", "/clo/status")

    def get_legal_entry(self, canonical_name: str) -> Dict[str, Any]:
        encoded = urllib.parse.quote(canonical_name, safe="")
        return self._request("GET", f"/clo/legal/{encoded}")

    def query_by_domain(self, domain_name: str) -> Dict[str, Any]:
        encoded = urllib.parse.quote(domain_name, safe="")
        return self._request("GET", f"/clo/domain/{encoded}")

    def query_by_confidence(self, level: str) -> Dict[str, Any]:
        return self._request("POST", "/clo/legal/query", {"confidence": level})


def connectivity_check() -> Dict[str, str]:
    if not is_clo_enabled():
        return {"status": "DISABLED", "detail": "CLO_ENABLED=false"}
    try:
        CLOConsumerClient().status()
        return {"status": "PASS", "detail": "CLO reachable"}
    except Exception as exc:
        return {"status": "DEGRADED", "detail": str(exc)[:200]}


def sync_domain_into_pipeline(domain_name: str, actor: str = "clo_consumer") -> Dict[str, Any]:
    """
    Pull governed CLO domain data and ingest into NYAI knowledge pipeline.
    """
    if not is_clo_enabled() or not is_clo_sync_enabled():
        return {"status": "SKIPPED", "detail": "CLO flags disabled", "ingested": 0}

    payload = CLOConsumerClient().query_by_domain(domain_name)
    records: List[Dict[str, Any]] = payload.get("results") or payload.get("entries") or []
    if not isinstance(records, list):
        records = []

    ingested = 0
    errors: List[str] = []

    from ingestion.pipeline import ingest_clo_document

    for record in records:
        if not isinstance(record, dict):
            continue
        try:
            ingest_clo_document(record, actor=actor)
            ingested += 1
        except Exception as exc:  # fail-safe: record and continue
            errors.append(str(exc)[:200])

    return {"status": "SUCCESS", "detail": "CLO sync completed", "ingested": ingested, "errors": errors}
