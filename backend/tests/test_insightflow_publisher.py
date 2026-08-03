"""Tests for InsightFlow publisher (Phase VI Section 4.3)."""
import json
import os
import sys
from unittest.mock import MagicMock, patch

import pytest

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from ecosystem import insightflow_publisher
from ecosystem.insightflow_publisher import (
    InsightFlowHTTPError,
    is_insightflow_enabled,
    publish_query_telemetry,
    register_dataset_if_needed,
)


@pytest.fixture(autouse=True)
def _reset_state(monkeypatch):
    monkeypatch.delenv("INSIGHTFLOW_ENABLED", raising=False)
    monkeypatch.delenv("INSIGHTFLOW_API_KEY", raising=False)
    monkeypatch.delenv("INSIGHTFLOW_ENDPOINT", raising=False)
    insightflow_publisher._dataset_registered = False
    insightflow_publisher._dataset_id = None


def test_disabled_by_default():
    assert is_insightflow_enabled() is False
    publish_query_telemetry({"trace_id": "t1"})
    register_dataset_if_needed()


def test_fail_open_local_fallback(monkeypatch, tmp_path):
    monkeypatch.setenv("INSIGHTFLOW_ENABLED", "true")
    monkeypatch.setenv("INSIGHTFLOW_ENDPOINT", "http://insightflow.test")
    monkeypatch.setenv("INSIGHTFLOW_API_KEY", "placeholder-key")
    monkeypatch.setenv("OUTPUT_DIRECTORY", str(tmp_path))

    with patch(
        "ecosystem.insightflow_publisher._request",
        side_effect=ConnectionError("down"),
    ):
        publish_query_telemetry({"trace_id": "trace-if-1", "domain": "criminal"})

    log_path = tmp_path / "insightflow_traces.jsonl"
    assert log_path.exists()
    lines = [ln for ln in log_path.read_text(encoding="utf-8").splitlines() if ln.strip()]
    record = json.loads(lines[-1])
    assert record["type"] == "query_telemetry"
    assert record["payload"]["trace_id"] == "trace-if-1"


def test_register_persists_dataset_id_and_reuses_for_provenance(monkeypatch):
    monkeypatch.setenv("INSIGHTFLOW_ENABLED", "true")
    monkeypatch.setenv("INSIGHTFLOW_ENDPOINT", "http://insightflow.test")
    monkeypatch.setenv("INSIGHTFLOW_API_KEY", "placeholder-key")

    calls = []

    def _fake_request(method, path, **kwargs):
        calls.append((method, path, kwargs.get("body")))
        if path == "/api/v1/datasets/":
            return {"id": "dataset-123"}
        if path == "/api/v1/datasets/dataset-123/provenance":
            return {"id": "prov-1"}
        raise AssertionError(f"unexpected path: {path}")

    with patch("ecosystem.insightflow_publisher._request", side_effect=_fake_request):
        publish_query_telemetry({"trace_id": "trace-1", "domain": "criminal"})
        publish_query_telemetry({"trace_id": "trace-2", "domain": "civil"})

    dataset_posts = [c for c in calls if c[1] == "/api/v1/datasets/"]
    provenance_posts = [c for c in calls if "/provenance" in c[1]]
    assert len(dataset_posts) == 1
    assert len(provenance_posts) == 2
    assert provenance_posts[0][2]["event_type"] == "VALIDATION"
    assert provenance_posts[0][2]["recorded_by"] == "NYAI"


def test_register_on_409_uses_canonical_lookup(monkeypatch):
    monkeypatch.setenv("INSIGHTFLOW_ENABLED", "true")
    monkeypatch.setenv("INSIGHTFLOW_ENDPOINT", "http://insightflow.test")
    monkeypatch.setenv("INSIGHTFLOW_API_KEY", "placeholder-key")

    calls = []

    def _fake_request(method, path, **kwargs):
        calls.append((method, path))
        if path == "/api/v1/datasets/":
            raise InsightFlowHTTPError(409, "already exists")
        if path == f"/api/v1/datasets/canonical/{insightflow_publisher.DATASET_CANONICAL_ID}":
            return {"id": "dataset-existing"}
        if path == "/api/v1/datasets/dataset-existing/provenance":
            return {"id": "prov-existing"}
        raise AssertionError(f"unexpected path: {path}")

    with patch("ecosystem.insightflow_publisher._request", side_effect=_fake_request):
        publish_query_telemetry({"trace_id": "trace-409"})

    assert ("GET", f"/api/v1/datasets/canonical/{insightflow_publisher.DATASET_CANONICAL_ID}") in calls
    assert ("POST", "/api/v1/datasets/dataset-existing/provenance") in calls


def test_no_hardcoded_registry_key_in_source():
    source_path = os.path.join(
        os.path.dirname(os.path.dirname(os.path.abspath(__file__))),
        "ecosystem",
        "insightflow_publisher.py",
    )
    content = open(source_path, encoding="utf-8").read()
    assert "vijay_insightflow" not in content
