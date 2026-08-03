"""Tests for Vedant read-scoped ECOSYSTEM_READ_API_KEY (Phase VI Section 7)."""
import os
import sys

import pytest
from fastapi.testclient import TestClient

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

os.environ.setdefault("NYAI_API_KEY", "nyai-primary-key")
os.environ["ECOSYSTEM_READ_API_KEY"] = "vedant-read-only-key"

from api.main import app

client = TestClient(app, raise_server_exceptions=False)


def test_ecosystem_read_key_allows_knowledge_get():
    response = client.get(
        "/knowledge/assets",
        headers={"X-API-Key": "vedant-read-only-key"},
    )
    assert response.status_code != 401


def test_ecosystem_read_key_denied_for_post():
    response = client.post(
        "/knowledge/assets",
        headers={"X-API-Key": "vedant-read-only-key"},
        json={"title": "blocked"},
    )
    assert response.status_code == 401


def test_ecosystem_read_key_denied_for_nyaya():
    response = client.post(
        "/nyaya/query",
        headers={"X-API-Key": "vedant-read-only-key"},
        json={"query": "theft"},
    )
    assert response.status_code == 401
