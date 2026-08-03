# Architecture Changes — Phase VI

## New modules

| Path | Purpose |
|------|---------|
| `backend/ecosystem/bucket_producer.py` | Bucket HTTP producer + outbox |
| `backend/ecosystem/insightflow_publisher.py` | InsightFlow dataset publisher |
| `backend/ecosystem/bhiv_core_client.py` | Core health + registry proposal |
| `backend/ecosystem/proposed_nyai_registry_entry.json` | Registry entry for Raj (not merged) |
| `backend/api/ecosystem_router.py` | `/ecosystem/*/health` |

## Modified modules

| Path | Change |
|------|--------|
| `backend/api/trace_middleware.py` | X-Trace-Id propagate + echo |
| `backend/tantra/output_bucket.py` | Bucket forward after local store |
| `backend/evidence/storage_backend.py` | `BucketProducerBackend` |
| `backend/api/router.py` | InsightFlow telemetry hook post-query |
| `backend/api/security.py` | `ECOSYSTEM_READ_API_KEY` GET scope |
| `backend/api/health.py` | Ecosystem dependency checks (non-blocking) |
| `backend/api/main.py` | Mount ecosystem router |
| `backend/.env.example` | Phase VI env vars (commented, disabled) |

## Unchanged by design

- `raj_adapter/`, `sovereign_agents/`, `governed_execution/` — not reconnected
- No enforcement/BLOCK/RESTRICT verdicts introduced
- No `/execute_task` client

## Local artifacts (runtime)

- `output_logs/bucket_outbox.jsonl` — failed Bucket publishes
- `output_logs/insightflow_traces.jsonl` — InsightFlow fallback
