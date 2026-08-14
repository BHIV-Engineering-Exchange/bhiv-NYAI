# NYAI — End-to-End Validation Report

> **Date**: 2026-08-14
> **Scope**: Full codebase audit and end-to-end test execution for the NYAI platform.
> **Environment**: Windows 10/11, Python 3.13.7 (local), Node v24.12.0, npm 11.10.0, pytest 9.0.1, Playwright 1.x.
> **Production pin**: Python 3.11.9 (`backend/runtime.txt`).

---

## 1. Test Execution Summary

### 1.1 Backend pytest Suite — `tests/`

Command:
```bash
cd backend
python -m pytest tests/ --ignore=tests/test_faiss_search.py -v
```

**Result: `165 passed` in 412.76s (0:06:52).**

The suite includes unit tests (in-process `TestClient`), integration tests (persistent stores, provenance chain, ecosystem clients), and **7 live-production tests** (`tests/test_live_backend.py`) that execute against `https://nyai-backend-n9h8.onrender.com`.

| Category | Modules | Result |
|---|---|---|
| Ecosystem clients (Bucket, Core, CLO, InsightFlow, Samachar) | `test_bucket_producer.py`, `test_bhiv_core_client.py`, `test_clo_consumer.py`, `test_insightflow_publisher.py`, `test_samachar_client.py`, `test_restart_recovery.py` | ✅ |
| Phase V (Knowledge/Ingestion/Promotion/Graph/Workspace) | `test_knowledge_*.py`, `test_ingestion_pipeline.py`, `test_promotion_pipeline.py`, `test_graph_runtime.py`, `test_workspace_apis.py`, `test_replay_knowledge.py`, `test_determinism_knowledge.py` | ✅ |
| Evidence infrastructure | `test_evidence_infrastructure.py` (14 tests) | ✅ |
| Production hardening | `test_production_hardening.py`, `test_trace_middleware.py`, `test_concurrency.py` | ✅ |
| Convergence | `test_tantra_convergence.py` (6 tests) | ✅ |
| Retrieval/statutes | `test_statute_retrieval_fixed.py`, `test_tax_statute_support.py`, `test_legal_database_full_section_retrieval.py`, `test_groq_retrieval_augmentor.py`, `test_loader_integration.py` | ✅ |
| **Live production** | `test_live_backend.py` (7 tests) | ✅ 200/401/422/503 paths verified |

**HTTP status codes verified live**: `200` (health, query), `401 INVALID_API_KEY` (bad key), `401 UNAUTHORIZED` (missing key), `422` (invalid payload), `503` (degraded `/health/ready`).

### 1.2 Database Loading Verification

Command:
```bash
cd backend
python tests/verify_db_loading.py
```

**Result: PASS.** `Total sections loaded: 9,723` across `121 unique acts` (70 JSON files in `backend/db/`).
- BNS: **776** sections
- IPC: **1,259** sections
- CrPC: **1,272** sections
- UK dataset: 948 sections (plus UK civil procedure rules 58, UK constitution reference 53, UK Human Rights Act 42)

> Note: earlier README text cited "118 unique acts"; the verified figure is **121**.

### 1.3 Local Smoke Test (localhost:8000)

Command (server started via `uvicorn api.main:app --host 127.0.0.1 --port 8000`):
```bash
cd backend
python _local_smoke_test.py
```

**Result: 7 / 7 PASS.**
- `GET /health` → 200
- `GET /health/ready` → degraded (valid body)
- `GET /metrics` → 200 with `requests`/`uptime_seconds`
- `POST /nyaya/query` no key → **401 UNAUTHORIZED**
- `POST /nyaya/query` with key → **200** (`trace_id` returned)
- `recommendation.type` → `INFORM` (valid enum member)
- `POST /nyaya/query` wrong key → **401 INVALID_API_KEY**

### 1.4 Live Production Smoke Test (Render)

Command:
```bash
cd backend
$env:SMOKE_BASE_URL="https://nyai-backend-n9h8.onrender.com"
python _local_smoke_test.py
```

**Result: 7 / 7 PASS** — same checks pass against the deployed production backend.

### 1.5 Frontend Build

Command:
```bash
cd frontend
npm run build
```

**Result: OK.** `vite v7.3.1`, 184 modules transformed, output `dist/` (index.html 3.78 kB, JS 422.86 kB / gzip 131.23 kB, CSS 16.91 kB). Built in 4.62s.

### 1.6 Frontend E2E (Playwright)

Command:
```bash
cd frontend
npx playwright test --project=chromium
```

**Result: 10 / 10 passed** (12.7m, 1 worker). Coverage in `frontend/e2e/gravitas.spec.ts`:
1. Trace ID integrity (mock `POST /nyaya/query` → DOM `[data-testid="trace-id"]`)
2. Recommendation gatekeeper: INFORM / INSUFFICIENT_DATA / ESCALATE UI states
3. Rendering fidelity: JSON keys ↔ UI selectors
4. Resiliency: 500 error, network timeout, ECONNREFUSED
5. Trace ID persistence across reload; provenance chain in response

### 1.7 TANTRA v3 Contract Validation

A real `POST /nyaya/query` response was captured from the local server and validated against `final_decision_contract.json` (v2.0.0, `tantra_v3`):

- **All 11 required top-level fields present**: `domain, jurisdiction, confidence, statutes, recommendation, trace_id, schema_version, request_id, input_hash, determinism_proof, timestamp`
- `schema_version = "tantra_v3"` ✅
- `confidence` sub-fields `overall/jurisdiction/domain/statute_match/procedural_match` — 5/5 ✅
- `recommendation` = `{type, confidence, rationale}` ✅
- `determinism_proof` = `{input_hash, output_hash, version: "3.0.0"}` ✅
- Statutes correctly resolved: theft query → `Indian Penal Code §378` ✅
- `observer_validation.validation_status = "PASS"`, `schema_valid = true` ✅
- `answer_source = "local_fallback"` when Groq unavailable (fail-open path verified) ✅

---

## 2. API Surface Inventory

Verified against route decorators in `backend/api/` (77 routes) plus `backend/legal_database/enhanced_procedure_endpoints.py` (3 routes).

### Routers & prefixes

| Router | Prefix | Auth |
|---|---|---|
| `health.py` | `/health`, `/health/live`, `/health/ready` | None |
| `metrics.py` | `/metrics` | None |
| `main.py` | `/` | None |
| `router.py` | `/nyaya` | `X-API-Key` |
| `procedure_router.py` | `/nyaya/procedures` | `X-API-Key` |
| `evidence_router.py` | `/evidence` | `X-API-Key` |
| `ecosystem_router.py` | `/ecosystem` | None |
| `knowledge_router.py` | `/knowledge` | `X-API-Key` (GET also accepts `ECOSYSTEM_READ_API_KEY`) |
| `workspace_router.py` | `/workspace` | `X-API-Key` |
| `graph_router.py` | `/graph` | `X-API-Key` (GET also accepts `ECOSYSTEM_READ_API_KEY`) |
| `debug_router.py` | `/debug` | None — **only mounted when `ENABLE_DEBUG_ROUTES=true`** |
| `legal_database/enhanced_procedure_endpoints.py` | `/nyaya/procedures` | `X-API-Key` |

### Full route list (80 total)

```
/                                        GET   (info)
/health                                  GET
/health/live                             GET
/health/ready                            GET
/metrics                                 GET

POST /nyaya/query
POST /nyaya/multi_jurisdiction
POST /nyaya/explain_reasoning
POST /nyaya/feedback
POST /nyaya/tantra_flow
POST /nyaya/rl_signal
GET  /nyaya/trace/{trace_id}
GET  /nyaya/output/{trace_id}
GET  /nyaya/case_summary
GET  /nyaya/legal_routes
GET  /nyaya/timeline
GET  /nyaya/glossary
GET  /nyaya/jurisdiction_info?jurisdiction=IN|UK|UAE|KSA
GET  /nyaya/recommendation_status

POST /nyaya/procedures/analyze
GET  /nyaya/procedures/summary/{country}/{domain}
POST /nyaya/procedures/evidence/assess
POST /nyaya/procedures/failure/analyze
POST /nyaya/procedures/compare
GET  /nyaya/procedures/list
GET  /nyaya/procedures/schemas
GET  /nyaya/procedures/enhanced_analysis/{jurisdiction}/{domain}
GET  /nyaya/procedures/domain_classification/{jurisdiction}
GET  /nyaya/procedures/legal_sections/{jurisdiction}/{domain}

GET  /evidence/{trace_id}
GET  /evidence/search
GET  /evidence/hash/{input_hash}
GET  /evidence/recommendation/{rec_type}
GET  /evidence/jurisdiction/{country}
GET  /evidence/statute?keyword=
GET  /evidence/version/{evidence_version}
POST /evidence/verify
POST /evidence/verify/chain
POST /evidence/compare
POST /evidence/export

GET  /ecosystem/bhiv-core/health
GET  /ecosystem/bucket/health
GET  /ecosystem/clo/health
GET  /ecosystem/insightflow/health
GET  /ecosystem/samachar/health
GET  /ecosystem/svacs/health
POST /ecosystem/samachar/event
POST /ecosystem/svacs/event

POST /knowledge/assets
GET  /knowledge/assets
GET  /knowledge/assets/{asset_id}
GET  /knowledge/assets/{asset_id}/versions
GET  /knowledge/assets/{asset_id}/versions/{version_id}
GET  /knowledge/assets/{asset_id}/state
GET  /knowledge/assets/{asset_id}/integrity
GET  /knowledge/assets/{asset_id}/approval-trail
PATCH /knowledge/assets/{asset_id}
POST /knowledge/assets/{asset_id}/promote
POST /knowledge/assets/{asset_id}/rollback
POST /knowledge/ingest
GET  /knowledge/ingestion
GET  /knowledge/ingestion/{log_id}

POST /workspace/documents/upload
GET  /workspace/documents/{asset_id}/versions
GET  /workspace/documents/{doc_id_a}/compare/{doc_id_b}
GET  /workspace/documents/{doc_id}/annotations
GET  /workspace/documents/{doc_id}/audit
PATCH /workspace/documents/{doc_id}/metadata
POST /workspace/annotations

POST /graph/entities
GET  /graph/entities
GET  /graph/entities/{entity_id}
GET  /graph/entities/{entity_id}/dependencies
GET  /graph/entities/{entity_id}/impact
GET  /graph/entities/{entity_id}/citations
GET  /graph/path
POST /graph/relationships

GET  /debug/generate-nonce      (only when ENABLE_DEBUG_ROUTES=true)
GET  /debug/nonce-state
POST /debug/test-nonce
```

> See [API Reference](../API_REFERENCE.md) for request/response contracts per endpoint.

---

## 3. Environment Verification

- `backend/.env` present with `NYAI_API_KEY`, `HMAC_SECRET_KEY`, `GROQ_API_KEY`, `INSIGHTFLOW_API_KEY`, `ECOSYSTEM_READ_API_KEY` configured → full live test execution possible.
- `frontend/.env` / `.env.local` present with `VITE_API_URL` + `VITE_NYAI_API_KEY`.
- FAISS binary **not** installed locally → `tests/test_faiss_search.py` is excluded (README documents this).

---

## 4. Known Findings (documented, not code-fixed)

1. **Legacy root test scripts** (`backend/test_*.py`, 21 files): 15 pass, 6 fail. Failures are legacy drift, not current-feature regressions:
   - `test_statute_regression.py` — imports removed module `enhanced_legal_advisor`.
   - `test_api_procedural_steps.py` — `query_legal()` signature changed (now requires `http_request`).
   - `test_suicide_statute.py` — calls `/nyaya/query` without `X-API-Key` (auth gate now enforced).
   - `test_caselaw.py`, `test_hybrid_domains.py`, `test_dowry_demand_vs_death.py` — assert legacy `EnhancedLegalAdvisor` behaviors no longer produced.
   - `test_enhanced_backend.py`, `test_enhanced_integration.py`, `test_statute_bug.py` — fail only under Windows cp1252 console (pass with `PYTHONIOENCODING=utf-8`).
   The **authoritative** backend suite is `tests/` (165/165). These scripts are documented as legacy in the [Archive](../ARCHIVE.md).
2. **`frontend/src/tests/DAY3_TEST_RUNNER.js`** — calls `/nyaya/query` without `X-API-Key`; would receive 401. Legacy; superseded by the Playwright E2E suite.
3. **Committed credentials**: `frontend/.env` contains a live `VITE_NYAI_API_KEY` value; `backend/tests/test_live_backend.py:11` embeds the same key. Flagged for rotation; documented only per instructions.
4. **Deprecation warnings** (non-fatal): `datetime.utcnow()`, Pydantic v1 `@validator` / `.dict()` usage, FastAPI `on_event`. 1,610 warnings during pytest run — none cause failures.
