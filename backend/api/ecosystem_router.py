"""Ecosystem integration health endpoints (Phase VI — gated, non-blocking)."""
from __future__ import annotations

from typing import Any, Dict

from fastapi import APIRouter

ecosystem_router = APIRouter(prefix="/ecosystem", tags=["ecosystem"])


@ecosystem_router.get("/bucket/health")
async def bucket_health() -> Dict[str, Any]:
    from ecosystem.bucket_producer import get_bucket_producer_client, is_bucket_producer_enabled

    if not is_bucket_producer_enabled():
        return {"status": "DISABLED", "detail": "BUCKET_PRODUCER_ENABLED=false"}
    try:
        payload = get_bucket_producer_client().health()
        return {"status": "PASS", "bucket": payload}
    except Exception as exc:
        return {"status": "DEGRADED", "detail": str(exc)[:300]}


@ecosystem_router.get("/bhiv-core/health")
async def bhiv_core_health() -> Dict[str, Any]:
    from ecosystem.bhiv_core_client import connectivity_check

    return connectivity_check()


@ecosystem_router.get("/insightflow/health")
async def insightflow_health() -> Dict[str, Any]:
    from ecosystem.insightflow_publisher import health_check

    return health_check()


@ecosystem_router.get("/clo/health")
async def clo_health() -> Dict[str, Any]:
    from ecosystem.clo_consumer import connectivity_check

    return connectivity_check()


@ecosystem_router.get("/samachar/health")
@ecosystem_router.get("/svacs/health")
async def samachar_health() -> Dict[str, Any]:
    from ecosystem.samachar_client import connectivity_check

    return connectivity_check()


@ecosystem_router.post("/samachar/event")
@ecosystem_router.post("/svacs/event")
async def samachar_event(event_payload: Dict[str, Any]) -> Dict[str, Any]:
    from ecosystem.samachar_client import handle_refresh_event

    return handle_refresh_event(event_payload)

