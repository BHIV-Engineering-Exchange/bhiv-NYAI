"""
SAMACHAR / SVACS integration client (Phase VI) — event receiver and webhook dispatcher.
"""
from __future__ import annotations

import json
import os
import urllib.error
import urllib.request
from typing import Any, Dict, Optional
from ecosystem.clo_consumer import sync_domain_into_pipeline

def is_samachar_enabled() -> bool:
    return (
        os.environ.get("SAMACHAR_ENABLED", "false").lower() in {"1", "true", "yes"} or
        os.environ.get("SVACS_ENABLED", "false").lower() in {"1", "true", "yes"}
    )

def samachar_endpoint() -> str:
    # Support both SAMACHAR_ENDPOINT and SVACS_ENDPOINT env variables
    endpoint = os.environ.get("SAMACHAR_ENDPOINT") or os.environ.get("SVACS_ENDPOINT") or ""
    return endpoint.rstrip("/")

def connectivity_check() -> Dict[str, str]:
    if not is_samachar_enabled():
        return {"status": "DISABLED", "detail": "SAMACHAR_ENABLED=false"}
    
    endpoint = samachar_endpoint()
    if not endpoint:
        return {"status": "DEGRADED", "detail": "SAMACHAR_ENDPOINT not configured"}
        
    url = f"{endpoint}/health"
    req = urllib.request.Request(
        url,
        headers={"Accept": "application/json"},
        method="GET",
    )
    try:
        with urllib.request.urlopen(req, timeout=5.0) as resp:
            raw = resp.read().decode("utf-8")
            data = json.loads(raw) if raw else {}
            status = data.get("status") or "ONLINE"
            return {"status": "PASS", "detail": f"SAMACHAR/SVACS online ({status})"}
    except Exception as exc:
        return {"status": "DEGRADED", "detail": str(exc)[:200]}

def handle_refresh_event(event_payload: Dict[str, Any]) -> Dict[str, Any]:
    """
    Handle a legal refresh event webhook from SAMACHAR / SVACS.
    This consumes the event as a change signal and triggers a CLO re-sync.
    """
    if not is_samachar_enabled():
        return {"status": "DISABLED", "detail": "SAMACHAR_ENABLED=false"}
        
    try:
        event_type = event_payload.get("event_type") or "legal_refresh"
        domain = event_payload.get("domain") or "maritime"
        event_id = event_payload.get("event_id") or "unknown"
        
        # 1. Trigger CLO re-sync for the specified domain
        sync_result = sync_domain_into_pipeline(domain, actor=f"samachar_event_{event_id}")
        
        return {
            "status": "SUCCESS",
            "detail": f"Processed Samachar event {event_id} ({event_type}) for domain {domain}",
            "clo_sync": sync_result
        }
    except Exception as exc:
        return {
            "status": "DEGRADED",
            "detail": f"Failed to process Samachar event: {str(exc)}"
        }
