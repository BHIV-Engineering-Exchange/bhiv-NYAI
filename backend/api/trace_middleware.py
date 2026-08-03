"""
Trace ID middleware — TANTRA X-Trace-Id propagation (Phase VI Section 3.3).

Reads incoming X-Trace-Id when present; generates uuid4 only as fallback.
Echoes X-Trace-Id on every response.
"""
import uuid

from starlette.middleware.base import BaseHTTPMiddleware
from starlette.requests import Request

TRACE_HEADER = "X-Trace-Id"


class TraceIdMiddleware(BaseHTTPMiddleware):
    async def dispatch(self, request: Request, call_next):
        incoming_trace_id = request.headers.get(TRACE_HEADER)
        trace_id = incoming_trace_id if incoming_trace_id else str(uuid.uuid4())
        request.state.trace_id = trace_id
        response = await call_next(request)
        response.headers[TRACE_HEADER] = trace_id
        return response
