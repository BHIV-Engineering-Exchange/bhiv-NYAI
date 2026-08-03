"""Tests for Bucket producer integration (Phase VI Section 2)."""
import json
import os
import sys
from io import BytesIO
from unittest.mock import MagicMock, patch
from urllib.error import HTTPError

import pytest

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from ecosystem import bucket_producer
from ecosystem.bucket_producer import (
    BucketProducerClient,
    BucketProducerError,
    forward_evidence_to_bucket,
    is_bucket_producer_enabled,
)
from tantra.output_bucket import OutputBucket


@pytest.fixture(autouse=True)
def _disable_bucket_producer(monkeypatch):
    monkeypatch.delenv("BUCKET_PRODUCER_ENABLED", raising=False)
    bucket_producer._client = None


def _sample_record(trace_id: str = "trace-test-001") -> dict:
    return {
        "trace_id": trace_id,
        "timestamp": "2026-07-07T12:00:00Z",
        "input_hash": "abc",
        "output_hash": "def",
        "full_response": {"trace_id": trace_id},
        "entry_hash": "ghi",
    }


def test_disabled_by_default():
    assert is_bucket_producer_enabled() is False
    assert forward_evidence_to_bucket(_sample_record()) is None


def test_build_envelope_shape():
    client = BucketProducerClient(endpoint="http://bucket.test")
    envelope = client._build_envelope(
        _sample_record(),
        parent_hash="parent-hash-abc",
    )
    assert envelope["artifact_id"].startswith("nyai-")
    assert envelope["trace_id"] == "trace-test-001"
    assert envelope["schema_version"] == "1.0.0"
    assert envelope["source_module_id"] == "nyai.legal_query"
    assert envelope["artifact_type"] == "legal_query_evidence"
    assert envelope["parent_hash"] == "parent-hash-abc"
    assert "product_namespace" not in envelope


def test_publish_success_with_verification(monkeypatch):
    monkeypatch.setenv("BUCKET_PRODUCER_ENABLED", "true")
    client = BucketProducerClient(endpoint="http://bucket.test")
    record = _sample_record()

    chain_response = json.dumps(
        {"chain_state": {"last_hash": "hash-prev", "artifact_count": 1}}
    ).encode()
    write_response = json.dumps(
        {"artifact_id": "nyai-art-1", "hash": "hash-new"}
    ).encode()
    read_response = json.dumps(
        {
            "artifact": {
                "artifact_id": "nyai-art-1",
                "trace_id": "trace-test-001",
                "hash": "hash-new",
            },
            "hash": "hash-new",
        }
    ).encode()

    responses = [chain_response, write_response, read_response]
    call_count = {"n": 0}

    def fake_urlopen(req, timeout=30):
        body = responses[call_count["n"]]
        call_count["n"] += 1
        mock_resp = MagicMock()
        mock_resp.read.return_value = body
        mock_resp.__enter__ = lambda s: mock_resp
        mock_resp.__exit__ = MagicMock(return_value=False)
        return mock_resp

    with patch("urllib.request.urlopen", side_effect=fake_urlopen):
        result = client.publish(record)

    assert result["artifact_id"] == "nyai-art-1"
    assert result["verified"] is True


def test_lineage_conflict_retries(monkeypatch):
    client = BucketProducerClient(endpoint="http://bucket.test")
    record = _sample_record()

    chain_ok = json.dumps(
        {"chain_state": {"last_hash": "hash-prev", "artifact_count": 2}}
    ).encode()

    def fake_urlopen(req, timeout=30):
        url = req.full_url
        if "chain-state" in url:
            mock_resp = MagicMock()
            mock_resp.read.return_value = chain_ok
            mock_resp.__enter__ = lambda s: mock_resp
            mock_resp.__exit__ = MagicMock(return_value=False)
            return mock_resp
        raise HTTPError(
            url, 400, "bad", hdrs=None,
            fp=BytesIO(b'{"message": "Invalid parent_hash"}'),
        )

    with patch("urllib.request.urlopen", side_effect=fake_urlopen):
        with pytest.raises(BucketProducerError):
            client.publish(record)


def test_outbox_fallback_on_connection_error(monkeypatch, tmp_path):
    monkeypatch.setenv("BUCKET_PRODUCER_ENABLED", "true")
    monkeypatch.setenv("OUTPUT_DIRECTORY", str(tmp_path))
    bucket_producer._client = None

    client = BucketProducerClient(endpoint="http://bucket.test")

    with patch.object(client, "publish", side_effect=ConnectionError("down")):
        with patch.object(
            client, "get_chain_state", return_value={"last_hash": None, "artifact_count": 0}
        ):
            bucket_producer._client = client
            result = forward_evidence_to_bucket(_sample_record())

    assert result is None
    outbox = tmp_path / "bucket_outbox.jsonl"
    assert outbox.exists()
    line = json.loads(outbox.read_text(encoding="utf-8").strip())
    assert line["envelope"]["trace_id"] == "trace-test-001"


def test_output_bucket_local_store_unchanged_when_disabled(tmp_path):
    bucket = OutputBucket(bucket_dir=str(tmp_path))
    record = _sample_record("trace-local-only")
    receipt = bucket.store(record["full_response"])
    assert receipt["stored"] == "true"
    assert receipt["trace_id"] == "trace-local-only"
    assert "bucket_artifact_id" not in receipt
    stored = bucket.retrieve("trace-local-only")
    assert stored is not None


def test_trace_id_preserved_in_envelope():
    client = BucketProducerClient(endpoint="http://bucket.test")
    envelope = client._build_envelope(_sample_record("preserve-me"), parent_hash=None)
    assert envelope["trace_id"] == "preserve-me"
