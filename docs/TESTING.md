# NYAI — Testing Guide

> How to run every test suite and how to validate that the platform works. Results from the 2026-08-14 full run are in [Validation Report](validation/VALIDATION_REPORT.md). Re-verified 2026-08-17.

---

## 0. Test Inventory Overview

| Suite | Location | Command | Auth/Server needed |
|---|---|---|---|
| Backend pytest | `backend/tests/` | `python -m pytest tests/ --ignore=tests/test_faiss_search.py -v` | In-process; 7 tests hit live Render |
| DB loading | `backend/tests/verify_db_loading.py` | `python tests/verify_db_loading.py` | None |
| Local smoke | `backend/_local_smoke_test.py` | requires server on `:8000` | Running server + `.env` |
| Live smoke | `backend/_local_smoke_test.py` | `SMOKE_BASE_URL=<render>` | Live endpoint |
| Frontend build | `frontend/` | `npm run build` | Node |
| Frontend E2E | `frontend/e2e/` | `npx playwright test --project=chromium` | Starts dev server automatically |
| Contract validation | manual | see §7 | Server + real query |
| Legacy root scripts | `backend/test_*.py` | `python <file>.py` | Legacy — see §8 |

---

## 1. Backend pytest Suite

```bash
cd backend
python -m pytest tests/ --ignore=tests/test_faiss_search.py -v
```

- **Ignore the FAISS module** if the `faiss` binary isn't installed (default local setup).
- The 7 tests in `tests/test_live_backend.py` execute against the **live production server** and embed a valid API key — they verify `200 / 401 / 422 / 503` paths.
- **Baseline (2026-08-14): 165 passed** in ~7 minutes. Warnings (Pydantic/`utcnow` deprecations) are non-fatal.

### Isolate specific suites
```bash
python -m pytest tests/test_production_hardening.py tests/test_tantra_convergence.py -v
python -m pytest tests/test_evidence_infrastructure.py -v
python -m pytest tests/test_knowledge_repository.py tests/test_graph_runtime.py -v
```

### Optional: include FAISS
```bash
pip install faiss-cpu        # or compile faiss (see FAISS_INTEGRATION.md)
python -m pytest tests/test_faiss_search.py -v
```

---

## 2. Database Loading Verification

```bash
cd backend
python tests/verify_db_loading.py
```

**Pass criteria** (2026-08-14 baseline):
```
Total sections loaded: 9723
[ALL ACTS] Total unique acts: 121
  - BNS: 776 sections
  - IPC: 1259 sections
  - CrPC: 1272 sections
JSON files in db/ folder: 70
[SUCCESS] System is loading sections from db/ folder
```

---

## 3. Smoke Tests (server required)

### Start the backend
```bash
cd backend
start_backend.bat          # Windows
# or: python -m uvicorn api.main:app --host 127.0.0.1 --port 8000
```

### Local smoke
```bash
cd backend
python _local_smoke_test.py
# Expected: Summary: 7/7 smoke checks passed
```

The 7 checks: `/health` 200 · `/health/ready` body · `/metrics` body · `/nyaya/query` **401** without key · `/nyaya/query` **200** with key · `recommendation.type` valid enum · `/nyaya/query` **401 INVALID_API_KEY** with wrong key.

### Live production smoke
```bash
cd backend
$env:SMOKE_BASE_URL="https://nyai-backend-n9h8.onrender.com"   # PowerShell
# bash: export SMOKE_BASE_URL="https://nyai-backend-n9h8.onrender.com"
python _local_smoke_test.py
```

> Free-tier Render spins down after ~15 min idle; the first call can take 50+ s.

---

## 4. Frontend Build

```bash
cd frontend
npm run build
```
**Pass criteria**: `vite v7.3.1`, 184 modules transformed, `dist/` generated, exit code 0.

---

## 5. Frontend E2E (Playwright)

```bash
cd frontend
npm run build
npx playwright test --project=chromium
```
or with the UI/trace tooling:
```bash
npx playwright test --ui
npx playwright test --trace on
```

**Baseline (2026-08-14): 10 / 10 passed** (~12.7 min, single worker — `workers:1` is intentional to avoid menu-overlay races).

The suite (in `e2e/gravitas.spec.ts`) validates:
1. Trace ID continuity (mock `POST /nyaya/query`)
2. Recommendation gatekeeper UI states: INFORM / INSUFFICIENT_DATA / ESCALATE
3. Rendering fidelity (response JSON ↔ DOM selectors)
4. Resiliency: HTTP 500 → error UI, network timeout, ECONNREFUSED
5. Trace ID persistence across reload + provenance chain presence

> Requires Chromium browsers installed: `npx playwright install chromium` on first use.

---

## 6. Frontend Unit/Integration Helpers

- `frontend/src/tests/recommendation-states.test.js` — mock decision fixtures for the 4 recommendation types.
- `frontend/src/tests/backend-integration.test.js` + `DAY3_TEST_RUNNER.js` — **legacy**. They call `/nyaya/query` without `X-API-Key` and will receive `401` against the current backend. Superseded by the Playwright suite. (See [Archive](ARCHIVE.md).)

---

## 7. Manual Contract Validation (TANTRA v3)

To verify the response shape against the canonical contract (`final_decision_contract.json`, v2.0.0):

```bash
cd backend
python -m uvicorn api.main:app --host 127.0.0.1 --port 8000 &
curl -s -X POST http://127.0.0.1:8000/nyaya/query \
  -H "X-API-Key: $NYAI_API_KEY" -H "Content-Type: application/json" \
  -d '{"query":"theft of mobile phone","jurisdiction_hint":"India","user_context":{"role":"citizen","confidence_required":true}}' \
  | python -m json.tool
```

**Pass criteria** (all verified 2026-08-14):
- Present: `schema_version = "tantra_v3"`, `trace_id`, `request_id`, `input_hash`, `timestamp`, `domain`, `jurisdiction`, `confidence{overall,jurisdiction,domain,statute_match,procedural_match}`, `statutes`, `recommendation{type,confidence,rationale}`, `determinism_proof{input_hash,output_hash,version}`
- `recommendation.type ∈ {INFORM, REVIEW, ESCALATE, INSUFFICIENT_DATA}`
- `observer_validation.validation_status = "PASS"` and `schema_valid = true`
- `answer_source ∈ {groq_llm, local_fallback, skipped}`

---

## 8. Legacy Root Test Scripts (`backend/test_*.py`)

21 standalone scripts remain in `backend/` from the legacy advisor era. **They are not part of the authoritative suite.**

- **Run**: `python test_<name>.py`
- **Baseline (2026-08-14)**: 15 pass · 6 fail. Failures are legacy drift (removed `enhanced_legal_advisor` module, changed `query_legal` signature, missing `X-API-Key` header, old advisor behavior). 3 of the 6 pass with `PYTHONIOENCODING=utf-8` (Windows console emoji issue).
- Use `tests/` instead for authoritative results.

### Additional Legacy Scripts (not in `tests/`)

These scripts exist at the backend root or in subdirectories but are not part of the authoritative test suite:

| File | Purpose |
|---|---|
| `verify_indian_law_dataset.py` | Dataset verification |
| `verify_indian_law_complete.py` | Completeness check |
| `verify_all_files_loaded.py` | File loading verification |
| `data_bridge/test_loader.py` | Colocated data bridge test |

---

## 9. CI Notes

- Playwright config supports CI via `CI=true` (retries 2, starts its own dev server).
- The backend suite is environment-agnostic except `test_live_backend.py`, which requires network access to Render.
- GitHub Actions / Jenkins examples are in `frontend/E2E_SETUP.md`.

---

## 10. Verifying a Deployment (post-deploy checklist)

1. `GET /health` → `200 healthy`
2. `GET /health/ready` → `200/503` with valid `dependencies`
3. `POST /nyaya/query` no key → `401`
4. `POST /nyaya/query` valid key → `200` with `recommendation.type` set
5. `POST /nyaya/query` bad payload → `422`
6. `GET /metrics` → `200`
7. Run `_local_smoke_test.py` against the deployed URL → `7/7`
8. Frontend loads at the Vercel URL and `/docs` is reachable on the backend.
