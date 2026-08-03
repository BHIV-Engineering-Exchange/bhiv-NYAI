"""Phase VI production hardening — failure injection and ecosystem probes."""
import json
import os
import sys
from io import BytesIO
from unittest.mock import MagicMock, patch
from urllib.error import HTTPError

import pytest
from fastapi.testclient import TestClient

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

os.environ.setdefault("NYAI_API_KEY", "test-key-production-hardening")

from api.main import app
from ecosystem.bucket_producer import BucketProducerClient, BucketProducerError

client = TestClient(app, raise_server_exceptions=False)


@pytest.fixture(autouse=True)
def _force_flags_disabled(monkeypatch):
    monkeypatch.setenv("BUCKET_PRODUCER_ENABLED", "false")
    monkeypatch.setenv("BHIV_CORE_ENABLED", "false")
    monkeypatch.setenv("INSIGHTFLOW_ENABLED", "false")
    monkeypatch.setenv("CLO_ENABLED", "false")


def test_ecosystem_bucket_health_disabled():
    response = client.get("/ecosystem/bucket/health")
    assert response.status_code == 200
    assert response.json()["status"] == "DISABLED"


def test_ecosystem_clo_health_disabled():
    response = client.get("/ecosystem/clo/health")
    assert response.status_code == 200
    assert response.json()["status"] == "DISABLED"


def test_health_ready_includes_ecosystem_checks():
    response = client.get("/health/ready")
    assert response.status_code in (200, 503)
    deps = response.json().get("dependencies", {})
    assert "bucket_producer" in deps
    assert "bhiv_core" in deps
    assert "insightflow" in deps
    assert "clo" in deps


def test_bucket_lineage_conflict_injection():
    producer = BucketProducerClient(endpoint="http://bucket.test")
    record = {"trace_id": "inj-trace", "timestamp": "2026-07-07T12:00:00Z"}

    chain_ok = json.dumps(
        {"chain_state": {"last_hash": "stale-hash", "artifact_count": 3}}
    ).encode()

    attempts = {"n": 0}

    def fake_urlopen(req, timeout=30):
        url = req.full_url
        if "chain-state" in url:
            mock_resp = MagicMock()
            mock_resp.read.return_value = chain_ok
            mock_resp.__enter__ = lambda s: mock_resp
            mock_resp.__exit__ = MagicMock(return_value=False)
            return mock_resp
        attempts["n"] += 1
        raise HTTPError(
            url, 400, "bad", hdrs=None,
            fp=BytesIO(b'{"message": "Invalid parent_hash. Expected: other"}'),
        )

    with patch("urllib.request.urlopen", side_effect=fake_urlopen):
        with pytest.raises(BucketProducerError):
            producer.publish(record)

    assert attempts["n"] >= 1


def test_trace_header_on_health():
    response = client.get("/health", headers={"X-Trace-Id": "continuity-trace"})
    assert response.headers.get("X-Trace-Id") == "continuity-trace"


def test_insightflow_failure_injection(monkeypatch, tmp_path):
    monkeypatch.setenv("INSIGHTFLOW_ENABLED", "true")
    monkeypatch.setenv("INSIGHTFLOW_API_KEY", "test-key-failure-injection")
    monkeypatch.setenv("OUTPUT_DIRECTORY", str(tmp_path))

    from ecosystem import insightflow_publisher
    insightflow_publisher._dataset_registered = False
    insightflow_publisher._dataset_id = None

    def fake_urlopen(*args, **kwargs):
        raise ConnectionError("InsightFlow API is down")

    monkeypatch.setattr("urllib.request.urlopen", fake_urlopen)

    query_response = {"trace_id": "fail-inject-trace-999", "jurisdiction": "IN", "domain": "civil"}
    insightflow_publisher.publish_query_telemetry(query_response)

    fallback_file = tmp_path / "insightflow_traces.jsonl"
    assert fallback_file.exists()
    lines = fallback_file.read_text(encoding="utf-8").strip().split("\n")
    assert len(lines) >= 1

    data = json.loads(lines[0])
    assert data["type"] == "dataset_registration"

