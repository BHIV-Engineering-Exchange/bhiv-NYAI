"""
API Key Authentication Middleware for NYAI.

Protected routes: /nyaya/*, /evidence/*
Exempt routes: /health, /health/live, /health/ready, /metrics, /docs, /redoc, /
"""
import hmac
import logging
import os

from starlette.middleware.base import BaseHTTPMiddleware
from starlette.requests import Request
from starlette.responses import JSONResponse

from api.error_codes import ErrorCode

logger = logging.getLogger(__name__)

_PROTECTED_PREFIXES = ("/nyaya/", "/evidence/", "/knowledge/", "/workspace/", "/graph/")
_ECOSYSTEM_READ_PREFIXES = ("/knowledge/", "/graph/")


def _is_protected_path(path: str) -> bool:
    return any(path.startswith(prefix) for prefix in _PROTECTED_PREFIXES)


def _is_ecosystem_read_path(method: str, path: str) -> bool:
    return method.upper() == "GET" and any(
        path.startswith(prefix) for prefix in _ECOSYSTEM_READ_PREFIXES
    )


def _ecosystem_read_key_valid(provided_key: str) -> bool:
    configured = os.environ.get("ECOSYSTEM_READ_API_KEY", "").strip()
    if not configured:
        return False
    return hmac.compare_digest(provided_key, configured)


def _trace_id(request: Request) -> str:
    return getattr(request.state, "trace_id", "unknown")


def _client_ip(request: Request) -> str:
    forwarded = request.headers.get("X-Forwarded-For")
    if forwarded:
        return forwarded.split(",")[0].strip()
    if request.client and request.client.host:
        return request.client.host
    return "unknown"


def _increment_auth_failure() -> None:
    try:
        from api.metrics import metrics_store

        if not hasattr(metrics_store, "increment_auth_failure"):
            def increment_auth_failure() -> None:
                with metrics_store._lock:
                    metrics_store.auth_failure_count += 1

            metrics_store.increment_auth_failure = increment_auth_failure

        metrics_store.increment_auth_failure()
    except Exception:
        pass


def _auth_error_response(
    request: Request,
    *,
    status_code: int,
    error_code: str,
    message: str,
) -> JSONResponse:
    _increment_auth_failure()
    response = JSONResponse(
        status_code=status_code,
        content={
            "error_code": error_code,
            "message": message,
            "trace_id": _trace_id(request),
        },
        headers={"content-type": "application/json", "X-Error-Code": error_code},
    )
    logger.warning(
        "auth_failure",
        extra={
            "error_code": error_code,
            "client_ip": _client_ip(request),
            "endpoint": request.url.path,
            "trace_id": _trace_id(request),
        },
    )
    return response


class APIKeyAuthMiddleware(BaseHTTPMiddleware):
    """Fail-closed API key gate for /nyaya/* and /evidence/* routes."""

    async def dispatch(self, request: Request, call_next):
        if not _is_protected_path(request.url.path):
            return await call_next(request)

        configured_key = os.environ.get("NYAI_API_KEY")
        if not configured_key:
            if not getattr(APIKeyAuthMiddleware, "_degraded_logged", False):
                logger.critical(
                    "NYAI_API_KEY is not set — auth running in DEGRADED mode; "
                    "all protected requests will receive 503"
                )
                APIKeyAuthMiddleware._degraded_logged = True
            return _auth_error_response(
                request,
                status_code=503,
                error_code=ErrorCode.AUTH_CONFIGURATION_ERROR,
                message="API authentication is not configured",
            )

        provided_key = request.headers.get("X-API-Key")
        if provided_key is None or provided_key == "":
            return _auth_error_response(
                request,
                status_code=401,
                error_code=ErrorCode.UNAUTHORIZED,
                message="Missing or empty X-API-Key header",
            )

        if _is_ecosystem_read_path(request.method, request.url.path):
            if _ecosystem_read_key_valid(provided_key):
                return await call_next(request)

        if not hmac.compare_digest(provided_key, configured_key):
            return _auth_error_response(
                request,
                status_code=401,
                error_code=ErrorCode.INVALID_API_KEY,
                message="Invalid API key",
            )

        return await call_next(request)
