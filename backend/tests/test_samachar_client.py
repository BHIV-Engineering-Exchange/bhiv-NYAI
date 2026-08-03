"""Tests for Samachar / SVACS client integration (Phase VI)."""
import os
import sys
from unittest.mock import patch, MagicMock

import pytest

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from ecosystem.samachar_client import (
    connectivity_check,
    is_samachar_enabled,
    handle_refresh_event,
)


def test_samachar_disabled_by_default(monkeypatch):
    monkeypatch.delenv("SAMACHAR_ENABLED", raising=False)
    monkeypatch.delenv("SVACS_ENABLED", raising=False)
    assert is_samachar_enabled() is False
    assert connectivity_check()["status"] == "DISABLED"


def test_samachar_connectivity_success(monkeypatch):
    monkeypatch.setenv("SAMACHAR_ENABLED", "true")
    monkeypatch.setenv("SAMACHAR_ENDPOINT", "http://svacs.test")

    mock_response = MagicMock()
    mock_response.read.return_value = b'{"status": "ONLINE"}'
    mock_response.info.return_value = {}
    mock_response.__enter__.return_value = mock_response
    
    with patch("urllib.request.urlopen", return_value=mock_response):
        result = connectivity_check()

    assert result["status"] == "PASS"
    assert "online" in result["detail"].lower()


def test_samachar_connectivity_failure(monkeypatch):
    monkeypatch.setenv("SAMACHAR_ENABLED", "true")
    monkeypatch.setenv("SAMACHAR_ENDPOINT", "http://svacs.test")

    with patch("urllib.request.urlopen", side_effect=Exception("network down")):
        result = connectivity_check()

    assert result["status"] == "DEGRADED"
    assert "network down" in result["detail"]


def test_handle_refresh_event_disabled(monkeypatch):
    monkeypatch.delenv("SAMACHAR_ENABLED", raising=False)
    monkeypatch.delenv("SVACS_ENABLED", raising=False)
    result = handle_refresh_event({"event_id": "evt-1"})
    assert result["status"] == "DISABLED"


def test_handle_refresh_event_success(monkeypatch):
    monkeypatch.setenv("SAMACHAR_ENABLED", "true")
    
    sync_mock = MagicMock(return_value={"status": "SUCCESS", "ingested": 5})
    
    with patch("ecosystem.samachar_client.sync_domain_into_pipeline", sync_mock):
        result = handle_refresh_event({
            "event_id": "evt-100",
            "event_type": "legal_refresh",
            "domain": "maritime"
        })

    assert result["status"] == "SUCCESS"
    assert "Processed Samachar event evt-100" in result["detail"]
    assert result["clo_sync"]["status"] == "SUCCESS"
    assert result["clo_sync"]["ingested"] == 5
    sync_mock.assert_called_once_with("maritime", actor="samachar_event_evt-100")
