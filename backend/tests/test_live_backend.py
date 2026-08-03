"""
Comprehensive verification tests executing directly against the live backend URL.
Examines input parameters, response body, and handles multiple status codes.
"""
import json
import urllib.request
import urllib.error
import pytest

LIVE_HOST = "https://nyai-backend-n9h8.onrender.com"
NYAI_API_KEY = "248fcd0df29651f9faa16fd3f53c5dac5c45c43203c60abd3e6a86bd068195d6"


def test_live_health_200():
    """Verify live GET /health returns 200 and matches expected structure."""
    req = urllib.request.Request(f"{LIVE_HOST}/health", method="GET")
    with urllib.request.urlopen(req) as resp:
        assert resp.status == 200
        body = json.loads(resp.read().decode("utf-8"))
        assert body["status"] == "healthy"
        assert body["service"] == "nyaya-api-gateway"


def test_live_health_ready_200_or_503():
    """Verify live GET /health/ready returns 200 or 503 depending on dependency states and conforms to schema."""
    req = urllib.request.Request(f"{LIVE_HOST}/health/ready", method="GET")
    try:
        with urllib.request.urlopen(req) as resp:
            assert resp.status == 200
            body = json.loads(resp.read().decode("utf-8"))
            assert "status" in body
            assert "dependencies" in body
            assert "checks_passed" in body
    except urllib.error.HTTPError as err:
        assert err.code == 503
        body = json.loads(err.read().decode("utf-8"))
        assert "status" in body
        assert "dependencies" in body
        assert "error_code" in body


def test_live_query_401_unauthorized():
    """Verify live POST /nyaya/query with invalid/incorrect key yields 401 response and structured error body."""
    req = urllib.request.Request(
        f"{LIVE_HOST}/nyaya/query",
        data=json.dumps({
            "query": "maritime rules",
            "user_context": {"role": "lawyer"}
        }).encode("utf-8"),
        headers={"Content-Type": "application/json", "X-API-Key": "completely-invalid-key-123"},
        method="POST"
    )
    with pytest.raises(urllib.error.HTTPError) as excinfo:
        urllib.request.urlopen(req)
    
    assert excinfo.value.code == 401
    body = json.loads(excinfo.value.read().decode("utf-8"))
    assert body["error_code"] == "INVALID_API_KEY"
    assert "Invalid API key" in body["message"]


def test_live_query_422_unprocessable():
    """Verify live POST /nyaya/query with incomplete/invalid payload shape yields 422 response."""
    # missing user_context
    req = urllib.request.Request(
        f"{LIVE_HOST}/nyaya/query",
        data=json.dumps({"query": "maritime rules"}).encode("utf-8"),
        headers={"Content-Type": "application/json", "X-API-Key": NYAI_API_KEY},
        method="POST"
    )
    with pytest.raises(urllib.error.HTTPError) as excinfo:
        urllib.request.urlopen(req)
    
    assert excinfo.value.code == 422


def test_live_query_200_success():
    """Verify live POST /nyaya/query with valid parameters yields 200 and matches response schemas."""
    req = urllib.request.Request(
        f"{LIVE_HOST}/nyaya/query",
        data=json.dumps({
            "query": "maritime rules",
            "user_context": {"role": "lawyer"}
        }).encode("utf-8"),
        headers={"Content-Type": "application/json", "X-API-Key": NYAI_API_KEY},
        method="POST"
    )
    with urllib.request.urlopen(req) as resp:
        assert resp.status == 200
        body = json.loads(resp.read().decode("utf-8"))
        
        # Validate body logic structure
        assert "trace_id" in body
        assert "answer" in body
        assert "observer_validation" in body
        assert "determinism_proof" in body
        
        # Verify observer verification fields
        assert body["observer_validation"]["validation_status"] == "PASS"
        assert body["observer_validation"]["schema_valid"] is True


def test_live_samachar_health_degraded_or_pass():
    """Verify live GET /ecosystem/samachar/health returns a valid status payload (200)."""
    req = urllib.request.Request(f"{LIVE_HOST}/ecosystem/samachar/health", method="GET")
    with urllib.request.urlopen(req) as resp:
        assert resp.status == 200
        body = json.loads(resp.read().decode("utf-8"))
        assert "status" in body
        assert body["status"] in ("PASS", "DEGRADED", "DISABLED")


def test_live_samachar_event_422_unprocessable():
    """Verify live POST /ecosystem/samachar/event with non-dictionary payload yields 422 response."""
    req = urllib.request.Request(
        f"{LIVE_HOST}/ecosystem/samachar/event",
        data=json.dumps([1, 2, 3]).encode("utf-8"), # invalid event payload structure (list instead of dict)
        headers={"Content-Type": "application/json"},
        method="POST"
    )
    with pytest.raises(urllib.error.HTTPError) as excinfo:
        urllib.request.urlopen(req)
    
    assert excinfo.value.code == 422

