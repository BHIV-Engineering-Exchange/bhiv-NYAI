# Testing and Benchmarks (Phase VI)

## Test suite

```bash
cd backend
python -m pytest tests/ --ignore=tests/test_faiss_search.py -q
```

**Result (this sprint):** 153 passed (pre-existing collection error in `test_faiss_search.py` unchanged).

## New test modules

| File | Coverage |
|------|----------|
| `tests/test_bucket_producer.py` | Envelope, publish/verify, lineage retry, outbox |
| `tests/test_trace_middleware.py` | X-Trace-Id propagate/echo |
| `tests/test_insightflow_publisher.py` | Fail-open, no hardcoded key |
| `tests/test_bhiv_core_client.py` | Registry-only client |
| `tests/test_ecosystem_read_auth.py` | Vedant read key scope |
| `tests/test_ecosystem_integration.py` | Health probes, lineage injection |

## Feature-flag safety

Clean checkout with no new env vars: all ecosystem flags default `false` — behavior matches Phase V.

## Failure injection

- Bucket `400` parent_hash mismatch: retried then outbox (`test_bucket_producer.py`, `test_ecosystem_integration.py`)
- InsightFlow unreachable: local JSONL fallback (`test_insightflow_publisher.py`)

## Benchmarks

Latency/load benchmarks deferred to operational runbooks; in-process metrics remain at `GET /metrics`.
