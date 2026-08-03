"""
BHIV Core client — registry-only participation (Phase VI Section 3.4 reading (a)).

Provides health connectivity and registry entry payload.
Does NOT call /execute_task or /execute_sequence.
"""
from __future__ import annotations

import json
import logging
import os
import urllib.error
import urllib.request
from typing import Any, Dict, Optional

from api.trace_middleware import TRACE_HEADER

logger = logging.getLogger("nyai.ecosystem.bhiv_core")

PROPOSED_REGISTRY_ENTRY: Dict[str, Any] = {
    "nyai": {
        "name": "NYAI",
        "owner": "Shashank",
        "layer": "execution",
        "purpose": "Multi-jurisdiction legal query advisory runtime — advisory only, no enforcement authority",
        "url": "<NYAI's deployed base URL>",
        "endpoint": "/nyaya/query",
        "method": "POST",
        "deployment": "render",
        "status": "operational",
        "lifecycle_state": "ready",
        "canonical_version": "2.0.0",
        "min_compatible_version": "2.0.0",
        "failure_mode": "fail-closed",
        "capabilities": {
            "protocols": ["http/1.1"],
            "features": [
                "sync_http",
                "legal_query_advisory",
                "trace_replay",
                "evidence_generation",
            ],
            "auth_methods": ["api_key"],
            "data_formats": ["application/json"],
        },
        "trace_requirements": {
            "receives": ["X-Trace-Id"],
            "propagates": ["X-Trace-Id"],
            "generates": ["trace_id (fallback only)"],
        },
        "health_endpoint": "/health",
    }
}


def is_bhiv_core_enabled() -> bool:
    return os.environ.get("BHIV_CORE_ENABLED", "false").lower() in {
        "1", "true", "yes",
    }


def _endpoint() -> str:
    return os.environ.get("BHIV_CORE_ENDPOINT", "http://localhost:8003").rstrip("/")


class BhivCoreClient:
    """Read-only BHIV Core connectivity (no execution orchestration)."""

    def __init__(self, endpoint: Optional[str] = None, timeout_seconds: float = 10.0) -> None:
        self.endpoint = (endpoint or _endpoint()).rstrip("/")
        self.timeout_seconds = timeout_seconds

    def health(self, trace_id: Optional[str] = None) -> Dict[str, Any]:
        headers = {"Accept": "application/json"}
        if trace_id:
            headers[TRACE_HEADER] = trace_id
        req = urllib.request.Request(
            f"{self.endpoint}/health",
            headers=headers,
            method="GET",
        )
        try:
            with urllib.request.urlopen(req, timeout=self.timeout_seconds) as resp:
                return json.loads(resp.read().decode("utf-8"))
        except urllib.error.URLError as exc:
            raise ConnectionError(f"BHIV Core unreachable at {self.endpoint}: {exc}") from exc

    def get_proposed_registry_entry(self) -> Dict[str, Any]:
        return PROPOSED_REGISTRY_ENTRY


def connectivity_check(trace_id: Optional[str] = None) -> Dict[str, str]:
    if not is_bhiv_core_enabled():
        return {"status": "DISABLED", "detail": "BHIV_CORE_ENABLED=false"}
    try:
        BhivCoreClient().health(trace_id=trace_id)
        return {"status": "PASS", "detail": "BHIV Core reachable"}
    except Exception as exc:
        return {"status": "DEGRADED", "detail": str(exc)[:200]}
