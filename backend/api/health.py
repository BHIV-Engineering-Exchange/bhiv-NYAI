"""
Health check endpoints for NYAI API gateway.
Liveness and readiness probes — no API key required.
"""
import os
from datetime import datetime, timezone
from typing import Any, Dict

from fastapi import APIRouter
from fastapi.responses import JSONResponse

from api.error_codes import ErrorCode

health_router = APIRouter(tags=["health"])

SERVICE_NAME = "nyaya-api-gateway"
SERVICE_VERSION = "1.0.0"


def _utc_now_iso() -> str:
    return datetime.now(timezone.utc).strftime("%Y-%m-%dT%H:%M:%SZ")


def _basic_health_payload() -> Dict[str, Any]:
    return {
        "status": "healthy",
        "service": SERVICE_NAME,
        "version": SERVICE_VERSION,
        "timestamp": _utc_now_iso(),
    }


def output_bucket_check() -> Dict[str, str]:
    try:
        from tantra.output_bucket import output_bucket

        output_bucket.retrieve("__health_probe__")
        return {"status": "PASS", "detail": "output_bucket accessible"}
    except Exception as exc:
        return {"status": "FAIL", "detail": f"output_bucket error: {exc}"}


def ledger_check() -> Dict[str, str]:
    try:
        from provenance_chain.hash_chain_ledger import HashChainLedger

        ledger_path = os.environ.get("PROVENANCE_LEDGER_PATH", "provenance_ledger.json")
        ledger = HashChainLedger(ledger_path)
        ledger.verify_chain_integrity()
        return {"status": "PASS", "detail": "ledger accessible"}
    except Exception as exc:
        return {"status": "FAIL", "detail": f"ledger error: {exc}"}


def retriever_check() -> Dict[str, str]:
    try:
        import api.router as nyaya_router

        if getattr(nyaya_router, "advisor", None) is not None:
            return {"status": "PASS", "detail": "legal advisor initialized"}
        return {"status": "DEGRADED", "detail": "legal advisor not initialized"}
    except Exception as exc:
        return {"status": "DEGRADED", "detail": f"retriever check error: {exc}"}


def model_check() -> Dict[str, str]:
    if os.environ.get("GROQ_API_KEY"):
        return {"status": "PASS", "detail": "GROQ_API_KEY configured"}
    return {"status": "DEGRADED", "detail": "GROQ_API_KEY not set; LLM calls may fail"}


def _check_evidence_repository() -> dict:
    try:
        from evidence.repository import evidence_repository
        count = evidence_repository.count()
        return {"status": "PASS", "detail": f"Evidence repository accessible ({count} packages stored)"}
    except Exception as e:
        return {"status": "DEGRADED", "detail": f"Evidence repository: {str(e)[:200]}"}


def _check_knowledge_repository() -> dict:
    # Phase V — governed knowledge repository readiness.
    try:
        from knowledge.repository import knowledge_repository
        count = knowledge_repository.count()
        return {"status": "PASS", "detail": f"Knowledge repository accessible ({count} assets stored)"}
    except Exception as e:
        return {"status": "DEGRADED", "detail": f"Knowledge repository: {str(e)[:200]}"}


@health_router.get("/health")
async def health() -> Dict[str, Any]:
    return _basic_health_payload()


@health_router.get("/health/live")
async def health_live() -> Dict[str, Any]:
    return _basic_health_payload()


def _check_ecosystem_integrations() -> dict:
    checks = {}
    try:
        from ecosystem.bucket_producer import is_bucket_producer_enabled

        if is_bucket_producer_enabled():
            from ecosystem.bucket_producer import get_bucket_producer_client
            get_bucket_producer_client().health()
            checks["bucket_producer"] = {"status": "PASS", "detail": "Bucket reachable"}
        else:
            checks["bucket_producer"] = {"status": "DISABLED", "detail": "BUCKET_PRODUCER_ENABLED=false"}
    except Exception as e:
        checks["bucket_producer"] = {"status": "DEGRADED", "detail": str(e)[:200]}

    try:
        from ecosystem.bhiv_core_client import connectivity_check
        checks["bhiv_core"] = connectivity_check()
    except Exception as e:
        checks["bhiv_core"] = {"status": "DEGRADED", "detail": str(e)[:200]}

    try:
        from ecosystem.insightflow_publisher import health_check
        checks["insightflow"] = health_check()
    except Exception as e:
        checks["insightflow"] = {"status": "DEGRADED", "detail": str(e)[:200]}

    try:
        from ecosystem.clo_consumer import connectivity_check
        checks["clo"] = connectivity_check()
    except Exception as e:
        checks["clo"] = {"status": "DEGRADED", "detail": str(e)[:200]}

    try:
        from ecosystem.samachar_client import connectivity_check as samachar_conn
        checks["samachar"] = samachar_conn()
    except Exception as e:
        checks["samachar"] = {"status": "DEGRADED", "detail": str(e)[:200]}

    return checks


@health_router.get("/health/ready")
async def health_ready() -> JSONResponse:
    dependencies = {
        "output_bucket": output_bucket_check(),
        "ledger": ledger_check(),
        "retriever": retriever_check(),
        "model": model_check(),
        "evidence_repository": _check_evidence_repository(),
        "knowledge_repository": _check_knowledge_repository(),
    }
    dependencies.update(_check_ecosystem_integrations())

    statuses = [dep["status"] for dep in dependencies.values()]
    checks_passed = sum(1 for s in statuses if s in ("PASS", "DISABLED"))
    checks_total = len(statuses)

    if any(s == "FAIL" for s in statuses):
        overall = "unavailable"
        http_status = 503
    elif any(s == "DEGRADED" for s in statuses):
        overall = "degraded"
        http_status = 200
    else:
        overall = "ready"
        http_status = 200

    body = {
        "status": overall,
        "timestamp": _utc_now_iso(),
        "dependencies": dependencies,
        "checks_passed": checks_passed,
        "checks_total": checks_total,
    }
    if http_status == 503:
        body["error_code"] = ErrorCode.DEPENDENCY_FAILURE
        body["message"] = "One or more required dependencies are unavailable"
    return JSONResponse(status_code=http_status, content=body)
