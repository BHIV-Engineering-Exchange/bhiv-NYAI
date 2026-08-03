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

SAMACHAR (SVACS) is fully integrated and operational.

Implemented:
- `backend/ecosystem/samachar_client.py`:
  - feature flags: `SAMACHAR_ENABLED`, `SVACS_ENABLED` (both default true in backend/.env)
  - webhook event handler `handle_refresh_event` which processes the incoming change signals and triggers the CLO data sync (`sync_domain_into_pipeline`).
  - `connectivity_check()` endpoint ping checks targeting `/health` to verify if the SVACS Vision Intelligence runtime is active.
- `backend/api/ecosystem_router.py`:
  - `GET /ecosystem/samachar/health` and `/ecosystem/svacs/health` health probes.
  - `POST /ecosystem/samachar/event` and `/ecosystem/svacs/event` webhook signal handlers.
- `backend/api/health.py`:
  - Folded the Samachar connectivity check into the gateway `/health/ready` check list.
- Tests:
  - `backend/tests/test_samachar_client.py` unit checks.
  - `backend/tests/test_live_backend.py` verification suite running directly against the live backend deployment.

Behavior:
1. Consumes SAMACHAR as a change signal webhook.
2. Triggers downstream CLO re-sync using `sync_domain_into_pipeline`.
3. Avoids direct knowledge ownership overlap in NYAI.
