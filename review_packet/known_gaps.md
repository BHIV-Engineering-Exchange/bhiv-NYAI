# Known Gaps — Phase VI (Evidence-Backed)

## Open gaps

| # | Item | Current state (verified) | Owner |
|---|------|---------------------------|-------|
| 1 | Bucket governance record | Attempted `POST /governance/gate/validate-integration` on 2026-07-08; upstream validation returned request-shape errors. Follow-up from user says this endpoint is static and only selected products are approved, so NYAI should not treat this route as a generic runtime prerequisite. Need Siddhesh/static-product approval evidence instead. | Siddhesh + NYAI |
| 2 | Bucket write-path auth | No request-level auth on Bucket write path; NYAI keeps fail-safe producer behavior. | Siddhesh |
| 3 | Core registry merge | `BHIV-Core-TANTRA-Sutradhar/TANTRA_INTEGRATION_REGISTRY.json` still has no `nyai` key. | Raj |
| 4 | InsightFlow credentials | Endpoint is confirmed as `https://bhiv-mdu-api.onrender.com`; a real API key was provided out-of-band and must remain in local/deployment secrets only. `INSIGHTFLOW_ENABLED` stays `false` until health is verified with the secret installed. | Vijay + NYAI |
| 5 | GC-Shakti / CLO process status | CLO API itself is confirmed live at `https://shakti-gc-infra.onrender.com/clo/status` via the in-process `CLODirectProvider` and currently requires no auth. Broader GC-Shakti integration is still in progress with Ansh, so production enablement remains conservative. | Ansh |

## Completed in this pass

| Item | Evidence |
|------|----------|
| SAMACHAR / SVACS integration | Integrated with SVACS Vision Intelligence runtime (`https://bhiv-svacs.onrender.com`), exposing `/ecosystem/samachar/health` and `/ecosystem/samachar/event` webhook endpoints to trigger CLO re-sync, backed by unit tests in `test_samachar_client.py` and live backend integration checks. |
| InsightFlow duplicate-registration bug fix | `backend/ecosystem/insightflow_publisher.py` now caches `dataset_id`, handles 409 via canonical lookup, and writes telemetry to `/api/v1/datasets/{dataset_id}/provenance`. |
| CLO integration scaffold | Added `backend/ecosystem/clo_consumer.py`, `/ecosystem/clo/health`, readiness aggregation, and `backend/tests/test_clo_consumer.py`. |
| Local env fail-safe defaults | `backend/.env` and `backend/.env.example` keep CLO disabled by default and keep risky ecosystem flags fail-safe locally. |
| Ecosystem Outbox Recovery | Added `recover_bucket_outbox` and `recover_insightflow_outbox` running in background threads at startup. Covered by `tests/test_restart_recovery.py`. |
| Outbox Thread-Safety | Implemented locks around outbox files for safe concurrent writing. Covered by `tests/test_concurrency.py`. |
| InsightFlow Failure-Injection Test | Covered fallback-to-local-JSONL path in `tests/test_ecosystem_integration.py`. |

## Notes

- Code and runtime checks are treated as source of truth over prior checklist claims.
- No external repo files were edited from NYAI.
