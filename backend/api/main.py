import sys
import os
from pathlib import Path
sys.path.append('.')
sys.path.append('..')

try:
    from dotenv import load_dotenv
except ImportError:
    load_dotenv = None

if load_dotenv:
    load_dotenv(Path(__file__).resolve().parent.parent / ".env")

from fastapi import FastAPI, Request, HTTPException
from fastapi.middleware.cors import CORSMiddleware
try:
    from api.router import router
except ImportError:
    from .router import router

from api.health import health_router
from api.metrics import metrics_router
from api.structured_logger import StructuredLoggingMiddleware
from api.rate_limiter import RateLimiterMiddleware
from api.security import APIKeyAuthMiddleware
from api.trace_middleware import TraceIdMiddleware
from api.error_codes import ErrorCode

import uvicorn

# Create FastAPI app
app = FastAPI(
    title="Nyaya Legal AI API Gateway",
    description="Sovereign-compliant API gateway for multi-agent legal intelligence",
    version="1.0.0",
    docs_url="/docs",
    redoc_url="/redoc"
)


@app.on_event("startup")
async def startup_event():
    import threading
    try:
        from ecosystem.bucket_producer import recover_bucket_outbox
        threading.Thread(target=recover_bucket_outbox, daemon=True).start()
    except Exception:
        pass

    try:
        from ecosystem.insightflow_publisher import recover_insightflow_outbox
        threading.Thread(target=recover_insightflow_outbox, daemon=True).start()
    except Exception:
        pass

# Support comma-separated origins from environment variables for dynamic setups
env_origins = os.getenv("ALLOWED_ORIGINS", "")
if env_origins:
    allowed_origins = [o.strip() for o in env_origins.split(",") if o.strip()]
else:
    allowed_origins = [
        "http://localhost:3000",
        "http://localhost:5173",
        "http://127.0.0.1:3000",
        "http://127.0.0.1:5173",
    ]

# Include FRONTEND_URL if set
frontend_url = os.getenv("FRONTEND_URL", "")
if frontend_url and frontend_url not in allowed_origins:
    allowed_origins.append(frontend_url)

# Global exception handler — FAIL CLOSED
@app.exception_handler(Exception)
async def global_exception_handler(request: Request, exc: Exception):
    from fastapi.responses import JSONResponse
    trace_id = getattr(request.state, 'trace_id', 'unknown')
    return JSONResponse(
        status_code=500,
        content={
            "error_code": ErrorCode.INTERNAL_ERROR,
            "message": f"TANTRA FAIL CLOSED: {str(exc)}",
            "trace_id": trace_id
        }
    )

# Production hardening middleware (innermost registered first)
app.add_middleware(APIKeyAuthMiddleware)
app.add_middleware(RateLimiterMiddleware)
app.add_middleware(StructuredLoggingMiddleware)
app.add_middleware(TraceIdMiddleware)
app.add_middleware(
    CORSMiddleware,
    allow_origins=allowed_origins,
    allow_origin_regex=r"https?://(localhost|127\.0\.0\.1)(:\d+)?",
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Routers — health and metrics before nyaya (no auth required)
app.include_router(health_router)
app.include_router(metrics_router)
try:
    from api.ecosystem_router import ecosystem_router
    app.include_router(ecosystem_router)
except ImportError:
    pass
from api.evidence_router import evidence_router
app.include_router(evidence_router)
app.include_router(router)

# Include procedure router
try:
    from api.procedure_router import procedure_router
    app.include_router(procedure_router)
except ImportError:
    pass

# Include enhanced legal database endpoints
try:
    from legal_database.enhanced_procedure_endpoints import *
except ImportError:
    pass

# Include debug router (development only)
if os.getenv("ENABLE_DEBUG_ROUTES", "false").lower() in {"1", "true", "yes"}:
    try:
        from api.debug_router import debug_router
        app.include_router(debug_router)
    except ImportError:
        pass

# Phase V: Platform Infrastructure Expansion — mounted AFTER existing routers
import logging as _logging
_phase_v_logger = _logging.getLogger("nyai.phase_v")

try:
    from api.knowledge_router import knowledge_router
    app.include_router(knowledge_router)
except ImportError as e:
    _phase_v_logger.warning("knowledge_router not available: %s", e)

try:
    from api.workspace_router import workspace_router
    app.include_router(workspace_router)
except ImportError as e:
    _phase_v_logger.warning("workspace_router not available: %s", e)

try:
    from api.graph_router import graph_router
    app.include_router(graph_router)
except ImportError as e:
    _phase_v_logger.warning("graph_router not available: %s", e)

# Root endpoint
@app.get("/")
async def root():
    """Root endpoint with API information."""
    return {
        "service": "Nyaya Legal AI API Gateway",
        "version": "1.0.0",
        "description": "Sovereign-compliant multi-agent legal intelligence platform",
        "endpoints": {
            "query": "POST /nyaya/query",
            "multi_jurisdiction": "POST /nyaya/multi_jurisdiction",
            "explain_reasoning": "POST /nyaya/explain_reasoning",
            "feedback": "POST /nyaya/feedback",
            "trace": "GET /nyaya/trace/{trace_id}",
            "case_summary": "GET /nyaya/case_summary?trace_id={trace_id}",
            "legal_routes": "GET /nyaya/legal_routes?trace_id={trace_id}",
            "timeline": "GET /nyaya/timeline?trace_id={trace_id}",
            "glossary": "GET /nyaya/glossary?trace_id={trace_id}",
            "jurisdiction_info": "GET /nyaya/jurisdiction_info?jurisdiction={code}",
            "recommendation_status": "GET /nyaya/recommendation_status?trace_id={trace_id}",
            "rl_signal": "POST /nyaya/rl_signal",
            "procedure_analyze": "POST /nyaya/procedures/analyze",
            "procedure_summary": "GET /nyaya/procedures/summary/{country}/{domain}",
            "evidence_assess": "POST /nyaya/procedures/evidence/assess",
            "failure_analyze": "POST /nyaya/procedures/failure/analyze",
            "procedure_compare": "POST /nyaya/procedures/compare",
            "procedure_list": "GET /nyaya/procedures/list",
            "procedure_schemas": "GET /nyaya/procedures/schemas",
            "enhanced_analysis": "GET /nyaya/procedures/enhanced_analysis/{jurisdiction}/{domain}",
            "domain_classification": "GET /nyaya/procedures/domain_classification/{jurisdiction}",
            "legal_sections": "GET /nyaya/procedures/legal_sections/{jurisdiction}/{domain}",
            "health": "GET /health",
            "health_live": "GET /health/live",
            "health_ready": "GET /health/ready",
            "metrics": "GET /metrics",
            "docs": "GET /docs",
            "knowledge": {
                "register_asset": "POST /knowledge/assets",
                "get_asset": "GET /knowledge/assets/{asset_id}",
                "ingest": "POST /knowledge/ingest",
                "promote": "POST /knowledge/assets/{asset_id}/promote",
                "rollback": "POST /knowledge/assets/{asset_id}/rollback",
            },
            "workspace": {
                "upload": "POST /workspace/documents/upload",
                "annotate": "POST /workspace/annotations",
                "compare": "GET /workspace/documents/{doc_id_a}/compare/{doc_id_b}",
            },
            "graph": {
                "register_entity": "POST /graph/entities",
                "register_relationship": "POST /graph/relationships",
                "dependencies": "GET /graph/entities/{entity_id}/dependencies",
                "impact": "GET /graph/entities/{entity_id}/impact",
            },
        }
    }

if __name__ == "__main__":
    port = int(os.getenv("PORT", 8000))
    host = os.getenv("HOST", "0.0.0.0")

    uvicorn.run(
        "api.main:app",
        host=host,
        port=port,
        reload=True,
        log_level="info"
    )
