# CLO and SAMACHAR Integration (Phase VI)

## CLO status

`Shakti-GC-Infra/` is present and NYAI now includes a guarded CLO consumer path.

Implemented:

- `backend/ecosystem/clo_consumer.py`
  - feature flags: `CLO_ENABLED`, `CLO_SYNC_ENABLED` (both default false)
  - client endpoints:
    - `GET /clo/status`
    - `GET /clo/legal/{canonical_name}`
    - `GET /clo/domain/{domain_name}`
    - `POST /clo/legal/query` (confidence filter)
  - `connectivity_check()` for health/readiness
- `backend/ingestion/pipeline.py`
  - added `ingest_clo_document(...)`
  - enforces `metadata.source_system = "CLO"` before ingestion
- `backend/api/ecosystem_router.py`
  - added `GET /ecosystem/clo/health`
- `backend/api/health.py`
  - readiness now includes `clo` dependency
- tests:
  - `backend/tests/test_clo_consumer.py`
  - updated ecosystem integration readiness assertions

### CLO live status

Follow-up confirmation received:

- `CLO_ENDPOINT=https://shakti-gc-infra.onrender.com`
- `https://shakti-gc-infra.onrender.com/clo/status` returns the CLO registry status.
- The deployment serves CLO directly through the in-process `CLODirectProvider`.
- No CLO API key is required by the current deployment; leave `CLO_API_KEY` unset/empty.

CLO remains disabled by default in NYAI (`CLO_ENABLED=false`, `CLO_SYNC_ENABLED=false`) because the broader GC-Shakti integration process has started with Ansh but is not fully complete.

## SAMACHAR status

No SAMACHAR code/contract is available in workspace. Integration remains deferred.

Planned behavior when available:

1. consume SAMACHAR as change signal only
2. trigger CLO re-sync
3. avoid direct knowledge ownership overlap in NYAI
