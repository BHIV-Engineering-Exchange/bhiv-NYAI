"""Tests for TANTRA X-Trace-Id middleware (Phase VI Section 3.3)."""
import os
import sys

import pytest
from fastapi import FastAPI
from fastapi.testclient import TestClient
from starlette.requests import Request

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from api.trace_middleware import TRACE_HEADER, TraceIdMiddleware


def _build_app():
    app = FastAPI()
    app.add_middleware(TraceIdMiddleware)

    @app.get("/probe")
    async def probe(request: Request):
        return {"trace_id": request.state.trace_id}

    return app


def test_propagates_incoming_trace_id():
    client = TestClient(_build_app())
    expected = "2a1556b2-1c5a-41f4-9c19-4e9399be5443"
    response = client.get("/probe", headers={TRACE_HEADER: expected})
    assert response.status_code == 200
    assert response.json()["trace_id"] == expected
    assert response.headers[TRACE_HEADER] == expected


def test_generates_trace_id_when_absent():
    client = TestClient(_build_app())
    response = client.get("/probe")
    assert response.status_code == 200
    trace_id = response.json()["trace_id"]
    assert trace_id
    assert response.headers[TRACE_HEADER] == trace_id
