import json
import os
import sys
import threading
from concurrent.futures import ThreadPoolExecutor

import pytest
from fastapi.testclient import TestClient

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from api.main import app
from ecosystem import bucket_producer, insightflow_publisher

client = TestClient(app, raise_server_exceptions=False)


@pytest.fixture
def clean_flags(monkeypatch, tmp_path):
    monkeypatch.setenv("NYAI_API_KEY", "test-key-concurrency")
    monkeypatch.setenv("BUCKET_PRODUCER_ENABLED", "true")
    monkeypatch.setenv("INSIGHTFLOW_ENABLED", "true")
    monkeypatch.setenv("INSIGHTFLOW_API_KEY", "testkey")
    monkeypatch.setenv("OUTPUT_DIRECTORY", str(tmp_path))
    
    # Bypass RateLimiter
    monkeypatch.setattr("api.rate_limiter._limiter.check", lambda *args, **kwargs: (True, 0, ""))
    
    bucket_producer._client = None
    insightflow_publisher._dataset_registered = False
    insightflow_publisher._dataset_id = None
    yield
    bucket_producer._client = None
    insightflow_publisher._dataset_registered = False
    insightflow_publisher._dataset_id = None


def test_concurrent_requests_trace_safety(clean_flags, monkeypatch, tmp_path):
    # Mock urllib.request.urlopen to always raise ConnectionError
    # so that both Bucket and InsightFlow fall back to local outbox logs
    def fake_urlopen(*args, **kwargs):
        raise ConnectionError("Mocked network offline")
        
    monkeypatch.setattr("urllib.request.urlopen", fake_urlopen)

    num_threads = 15
    trace_ids = set()
    trace_ids_lock = threading.Lock()
    errors = []

    def make_request(index):
        try:
            # Use X-API-Key header expected by Nyaya gateway security
            headers = {"X-API-Key": "test-key-concurrency"}
            payload = {
                "query": f"GST penalty test query {index}",
                "jurisdiction_hint": "India",
                "user_context": {"role": "citizen", "confidence_required": True},
            }
            response = client.post("/nyaya/query", json=payload, headers=headers)
            
            if response.status_code != 200:
                errors.append(f"Request {index} failed with status {response.status_code}: {response.text}")
                return
                
            trace_id = response.headers.get("X-Trace-Id")
            assert trace_id is not None, "Response missing X-Trace-Id header"
            
            with trace_ids_lock:
                if trace_id in trace_ids:
                    errors.append(f"Duplicate trace_id detected: {trace_id}")
                trace_ids.add(trace_id)
        except Exception as e:
            errors.append(f"Request {index} raised exception: {str(e)}")

    with ThreadPoolExecutor(max_workers=num_threads) as executor:
        executor.map(make_request, range(num_threads))

    assert len(errors) == 0, f"Errors occurred during concurrency test: {errors}"
    assert len(trace_ids) == num_threads, f"Expected {num_threads} unique trace IDs, got {len(trace_ids)}"

    bucket_outbox = tmp_path / "bucket_outbox.jsonl"
    insight_outbox = tmp_path / "insightflow_traces.jsonl"

    if bucket_outbox.exists():
        with open(bucket_outbox, "r", encoding="utf-8") as f:
            for line in f:
                line = line.strip()
                if line:
                    data = json.loads(line)
                    assert "envelope" in data

    if insight_outbox.exists():
        with open(insight_outbox, "r", encoding="utf-8") as f:
            for line in f:
                line = line.strip()
                if line:
                    data = json.loads(line)
                    assert "type" in data
