# InsightFlow Telemetry (Phase VI)

InsightFlow source is present in workspace as `bhiv-registry/` and is now treated as contract source of truth.

## Confirmed contract used by NYAI

- Dataset registration: `POST /api/v1/datasets/`
- Canonical lookup on conflict: `GET /api/v1/datasets/canonical/{canonical_id}`
- Per-event provenance telemetry: `POST /api/v1/datasets/{dataset_id}/provenance`
- Provenance payload fields are aligned to `bhiv-registry/backend/app/schemas/registry.py::ProvenanceCreateRequest`:
  - `event_type`
  - `recorded_by`
  - optional `source_system`, `source_reference`, `ingestion_pipeline`, `notes`, `is_replay_safe`, `replay_context`

## NYAI implementation

`backend/ecosystem/insightflow_publisher.py` now:

1. Registers dataset once and caches returned `dataset_id`.
2. On `409`, resolves existing id via canonical lookup.
3. Publishes each query telemetry event to dataset provenance endpoint.
4. Fails open to local `insightflow_traces.jsonl` when upstream is unavailable.

## Environment and safety

- `.env.example` keeps `INSIGHTFLOW_ENABLED=false` by default.
- InsightFlow endpoint is confirmed as `https://bhiv-mdu-api.onrender.com`.
- A real API key was provided out-of-band; do not write it into tracked files or docs.
- Local/deployment secrets must set `INSIGHTFLOW_API_KEY` before enabling.
- Local `.env` should remain fail-safe (`INSIGHTFLOW_ENABLED=false`) until `/ecosystem/insightflow/health` passes with the secret installed.
- Never commit or hardcode InsightFlow keys.

## Current blockers

- Confirm the existing canonical dataset lookup succeeds:
  - `GET /api/v1/datasets/canonical/BHIV-DS-REPLAY-SEMANTIC-EVENTS-001`
  - header: `API-Key: <secret InsightFlow key>`
- Decide whether NYAI should use the existing canonical dataset above or keep/register NYAI's own canonical dataset id.
- Enable only after `/ecosystem/insightflow/health` reports `PASS`.

## Health

`GET /ecosystem/insightflow/health` feeds into `/health/ready` as a non-fatal ecosystem dependency.
