# BHIV Core Integration (Phase VI)

NYAI participates in the TANTRA ecosystem via **registry-only** attachment (Implementation.md Section 3.4 reading **(a)**).

## What was built

| Item | Status |
|------|--------|
| `X-Trace-Id` middleware fix | `backend/api/trace_middleware.py` |
| BHIV Core health client | `backend/ecosystem/bhiv_core_client.py` |
| Proposed registry entry | `backend/ecosystem/proposed_nyai_registry_entry.json` |

## What was NOT built (open question)

- No calls to `POST /execute_task` or `POST /execute_sequence` (Sarathi `execution_token` required).
- Runtime model remains registry-only for this phase.

## Registry entry

Proposed payload matches `TANTRA_INTEGRATION_REGISTRY.json` schema.  
Current state: **still not merged** into Core registry file; Raj-owned merge remains required.

## Environment

| Variable | Default |
|----------|---------|
| `BHIV_CORE_ENDPOINT` | `http://localhost:8003` |
| `BHIV_CORE_ENABLED` | `false` |

Local `.env` is kept fail-safe with `BHIV_CORE_ENABLED=false` until a confirmed reachable Core endpoint is supplied.

## Trace continuity

- Incoming `X-Trace-Id` preserved; echoed on response.
- Core's `GET /trace/{trace_id}` only reconstructs Core-orchestrated executions — NYAI-originated Bucket writes are not automatically visible there under registry-only participation.

## Health

`GET /ecosystem/bhiv-core/health`
