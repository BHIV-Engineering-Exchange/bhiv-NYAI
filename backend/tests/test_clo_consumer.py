"""Tests for CLO consumer integration."""
import os
import sys
from unittest.mock import patch

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from ecosystem.clo_consumer import connectivity_check


def test_clo_disabled_by_default(monkeypatch):
    monkeypatch.delenv("CLO_ENABLED", raising=False)
    assert connectivity_check()["status"] == "DISABLED"


def test_clo_connectivity_success(monkeypatch):
    monkeypatch.setenv("CLO_ENABLED", "true")
    monkeypatch.setenv("CLO_ENDPOINT", "https://shakti-gc-infra.onrender.com")
    with patch("ecosystem.clo_consumer.CLOConsumerClient.status", return_value={"status": "ok"}):
        result = connectivity_check()
    assert result["status"] == "PASS"


def test_clo_unknown_route_404_degraded(monkeypatch):
    monkeypatch.setenv("CLO_ENABLED", "true")
    monkeypatch.setenv("CLO_ENDPOINT", "https://shakti-gc-infra.onrender.com")
    with patch(
        "ecosystem.clo_consumer.CLOConsumerClient.status",
        side_effect=ConnectionError("CLO HTTP 404: not found"),
    ):
        result = connectivity_check()
    assert result["status"] == "DEGRADED"
    assert "404" in result["detail"]


def test_clo_governance_unconfigured_500_degraded(monkeypatch):
    monkeypatch.setenv("CLO_ENABLED", "true")
    monkeypatch.setenv("CLO_ENDPOINT", "https://shakti-gc-infra.onrender.com")
    with patch(
        "ecosystem.clo_consumer.CLOConsumerClient.status",
        side_effect=ConnectionError("CLO HTTP 500: provider not configured"),
    ):
        result = connectivity_check()
    assert result["status"] == "DEGRADED"
    assert "500" in result["detail"]
