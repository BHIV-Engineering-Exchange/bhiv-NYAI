"""Tests for BHIV Core client (registry-only, Section 3.4 reading a)."""
import os
import sys

import pytest

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from ecosystem.bhiv_core_client import (
    BhivCoreClient,
    PROPOSED_REGISTRY_ENTRY,
    connectivity_check,
    is_bhiv_core_enabled,
)


def test_disabled_by_default(monkeypatch):
    monkeypatch.delenv("BHIV_CORE_ENABLED", raising=False)
    assert is_bhiv_core_enabled() is False
    assert connectivity_check()["status"] == "DISABLED"


def test_proposed_registry_entry_shape():
    entry = PROPOSED_REGISTRY_ENTRY["nyai"]
    assert entry["endpoint"] == "/nyaya/query"
    assert entry["failure_mode"] == "fail-closed"
    assert "X-Trace-Id" in entry["trace_requirements"]["receives"]
    assert "execute_task" not in str(PROPOSED_REGISTRY_ENTRY)


def test_client_has_no_execute_methods():
    client = BhivCoreClient(endpoint="http://core.test")
    assert not hasattr(client, "execute_task")
    assert not hasattr(client, "execute_sequence")
    assert callable(client.health)
    assert callable(client.get_proposed_registry_entry)
