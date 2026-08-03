import json
import os
import sys
from unittest.mock import MagicMock, patch

import pytest

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from ecosystem import bucket_producer, insightflow_publisher
from ecosystem.bucket_producer import (
    recover_bucket_outbox,
    BucketProducerClient,
)
from ecosystem.insightflow_publisher import (
    recover_insightflow_outbox,
)


@pytest.fixture
def clean_clients():
    bucket_producer._client = None
    insightflow_publisher._dataset_registered = False
    insightflow_publisher._dataset_id = None
    yield
    bucket_producer._client = None
    insightflow_publisher._dataset_registered = False
    insightflow_publisher._dataset_id = None


def test_recover_bucket_outbox_success(monkeypatch, tmp_path, clean_clients):
    monkeypatch.setenv("BUCKET_PRODUCER_ENABLED", "true")
    monkeypatch.setenv("OUTPUT_DIRECTORY", str(tmp_path))

    # Pre-populate outbox
    outbox_file = tmp_path / "bucket_outbox.jsonl"
    record = {
        "queued_at": "2026-07-07T12:00:00Z",
        "error": "connection failed",
        "envelope": {
            "artifact_id": "nyai-test-123",
            "trace_id": "trace-123",
            "source_module_id": "nyai.legal_query",
            "artifact_type": "legal_query_evidence",
            "payload": {"trace_id": "trace-123", "decision": "ALLOW"},
        },
    }
    with open(outbox_file, "w", encoding="utf-8") as f:
        f.write(json.dumps(record) + "\n")

    client = BucketProducerClient(endpoint="http://bucket.test")
    publish_mock = MagicMock(return_value={"artifact_id": "nyai-test-123", "hash": "somehash", "verified": True})
    
    with patch.object(client, "publish", publish_mock):
        bucket_producer._client = client
        recover_bucket_outbox()

    assert publish_mock.call_count == 1
    # Verify that the outbox file is empty or removed
    if outbox_file.exists():
        assert outbox_file.read_text(encoding="utf-8").strip() == ""


def test_recover_bucket_outbox_failure(monkeypatch, tmp_path, clean_clients):
    monkeypatch.setenv("BUCKET_PRODUCER_ENABLED", "true")
    monkeypatch.setenv("OUTPUT_DIRECTORY", str(tmp_path))

    outbox_file = tmp_path / "bucket_outbox.jsonl"
    record = {
        "queued_at": "2026-07-07T12:00:00Z",
        "error": "connection failed",
        "envelope": {
            "artifact_id": "nyai-test-123",
            "trace_id": "trace-123",
            "source_module_id": "nyai.legal_query",
            "artifact_type": "legal_query_evidence",
            "payload": {"trace_id": "trace-123", "decision": "ALLOW"},
        },
    }
    with open(outbox_file, "w", encoding="utf-8") as f:
        f.write(json.dumps(record) + "\n")

    client = BucketProducerClient(endpoint="http://bucket.test")
    publish_mock = MagicMock(side_effect=Exception("still down"))
    
    with patch.object(client, "publish", publish_mock):
        bucket_producer._client = client
        recover_bucket_outbox()

    assert publish_mock.call_count == 1
    # Verify that the outbox file still has the record
    assert outbox_file.exists()
    lines = outbox_file.read_text(encoding="utf-8").strip().split("\n")
    assert len(lines) == 1
    data = json.loads(lines[0])
    assert data["envelope"]["trace_id"] == "trace-123"


def test_recover_insightflow_outbox_success(monkeypatch, tmp_path, clean_clients):
    monkeypatch.setenv("INSIGHTFLOW_ENABLED", "true")
    monkeypatch.setenv("INSIGHTFLOW_API_KEY", "testkey")
    monkeypatch.setenv("OUTPUT_DIRECTORY", str(tmp_path))

    fallback_file = tmp_path / "insightflow_traces.jsonl"
    record_reg = {
        "type": "dataset_registration",
        "payload": {"canonical_id": "nyai_telemetry"},
    }
    record_tel = {
        "type": "query_telemetry",
        "payload": {
            "event_type": "VALIDATION",
            "source_reference": "trace-456",
        },
    }
    with open(fallback_file, "w", encoding="utf-8") as f:
        f.write(json.dumps(record_reg) + "\n")
        f.write(json.dumps(record_tel) + "\n")

    request_mock = MagicMock(return_value={"id": "dataset-123"})
    with patch("ecosystem.insightflow_publisher._request", request_mock):
        recover_insightflow_outbox()

    # The registration call registers dataset, returning dataset ID.
    # The telemetry call posts telemetry.
    assert request_mock.call_count >= 1
    if fallback_file.exists():
        assert fallback_file.read_text(encoding="utf-8").strip() == ""


def test_recover_insightflow_outbox_failure(monkeypatch, tmp_path, clean_clients):
    monkeypatch.setenv("INSIGHTFLOW_ENABLED", "true")
    monkeypatch.setenv("INSIGHTFLOW_API_KEY", "testkey")
    monkeypatch.setenv("OUTPUT_DIRECTORY", str(tmp_path))

    fallback_file = tmp_path / "insightflow_traces.jsonl"
    record_tel = {
        "type": "query_telemetry",
        "payload": {
            "event_type": "VALIDATION",
            "source_reference": "trace-456",
        },
    }
    with open(fallback_file, "w", encoding="utf-8") as f:
        f.write(json.dumps(record_tel) + "\n")

    # Force registration to fail
    request_mock = MagicMock(side_effect=Exception("api down"))
    with patch("ecosystem.insightflow_publisher._request", request_mock):
        recover_insightflow_outbox()

    # Should attempt to register/post, fail, and re-write to fallback file
    assert fallback_file.exists()
    lines = fallback_file.read_text(encoding="utf-8").strip().split("\n")
    assert len(lines) >= 1
    found_telemetry = False
    for line in lines:
        data = json.loads(line)
        if data.get("type") == "query_telemetry":
            assert data["payload"]["source_reference"] == "trace-456"
            found_telemetry = True
            break
    assert found_telemetry

