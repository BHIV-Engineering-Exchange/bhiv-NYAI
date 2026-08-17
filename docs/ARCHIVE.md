# NYAI — Archive

> Registry of obsolete, superseded, and historical documentation. **Nothing is deleted** — files below are either updated with an archive banner pointing here, or retained untouched as historical records. Replacement docs live in [the hub](../README.md). Re-verified 2026-08-17.

---

## 1. How to Read This File

- **Superseded** = the content is wrong/outdated today. Use the "Replacement" instead.
- **Historical** = an accurate record of an earlier state. Do not use for current decisions; keep for audit.
- **Archived repos** = separate git-ignored directories, out of scope of this repo's docs.

---

## 2. Superseded Documents (replaced)

| File | Why superseded | Replacement |
|---|---|---|
| `backend/QUICKSTART.md` | Hardcoded `C:\Users\Gauri\Desktop` paths; curl examples missing `X-API-Key` header (401); stale dependency/run instructions | [docs/SETUP.md](SETUP.md), [docs/TESTING.md](TESTING.md) |
| `backend/README.md` | Duplicates root README; claims Python **3.7+** (actual min 3.11.x); stale env table | [docs/SETUP.md](SETUP.md), [docs/ENVIRONMENT_VARIABLES.md](ENVIRONMENT_VARIABLES.md) |
| `FAQ.md` | "Enforcement decisions" table still lists `ALLOW / ALLOW_INFORMATIONAL / SAFE_REDIRECT / RESTRICT`. The engine is now **advisory** — decision types are `INFORM / REVIEW / ESCALATE / INSUFFICIENT_DATA` | [docs/ARCHITECTURE.md](ARCHITECTURE.md) §Recommendations |
| `execution_walkthrough.md` | References removed `enforcement_engine/`; old flow. Current flow is `tantra/flow.py` (advisory) | [docs/ARCHITECTURE.md](ARCHITECTURE.md) §Query lifecycle |
| `backend/ARCHITECTURE.md` | Old architecture diagram/flow predates TANTRA v3, procedures, ecosystem | [docs/ARCHITECTURE.md](ARCHITECTURE.md) |
| `backend/SYSTEM_VALIDATION.md` | Old validation record (pre-dates current 165-test suite) | [docs/validation/VALIDATION_REPORT.md](validation/VALIDATION_REPORT.md) |
| `INTEGRATION_PLAN.md` | Phase-V integration plan that is fully executed; kept as history | [docs/ARCHITECTURE.md](ARCHITECTURE.md) §Ecosystem |
| `integration_note.md` | TANTRA v2-era integration note; superseded by v3 | [docs/ARCHITECTURE.md](ARCHITECTURE.md) |
| `DISCLOSURE_REPORT.md` | Archived disclosure/release note | [docs/validation/VALIDATION_REPORT.md](validation/VALIDATION_REPORT.md) |

## 3. Archived Repositories (git-ignored, out of scope)

These directories live at the repo root but are **separate git-ignored projects**. They are intentionally excluded from this repo's documentation index:

| Directory | What it is | Status |
|---|---|---|
| `bucket/` | Bucket integration service (Phase VI) | Archived |
| `Shakti-GC-Infra/` | CLO / Shakti GC infrastructure (Phase VI) | Archived |
| `BHIV-Core-TANTRA-Sutradhar/` | BHIV Core + TANTRA Sutradhar (Phase VI) | Archived |
| `bhiv-registry/` | BHIV Registry (Phase VI) | Archived |
| `bhiv-SVACS/` | SVACS event service (Phase VI) | Archived |

> `.gitignore` carries a comment marking these as archived. Do not edit or document their internals in this repo.

## 4. Legacy Test Scripts (superseded)

| File(s) | Issue | Replacement |
|---|---|---|
| `backend/test_statute_regression.py` | Imports removed `enhanced_legal_advisor` module | `backend/tests/` suite |
| `backend/test_api_procedural_steps.py` | `query_legal()` signature drift | `backend/tests/test_procedure_intelligence.py` etc. |
| `backend/test_suicide_statute.py` | Missing `X-API-Key` header (401) | `backend/tests/` suite |
| `backend/test_caselaw.py`, `test_hybrid_domains.py`, `test_dowry_demand_vs_death.py` | Assert legacy advisor behavior | `backend/tests/` suite |
| `backend/test_enhanced_backend.py`, `test_enhanced_integration.py`, `test_statute_bug.py` | Pass only with `PYTHONIOENCODING=utf-8`; legacy | `backend/tests/` suite |
| `frontend/src/tests/DAY3_TEST_RUNNER.js` | Calls `/nyaya/query` without `X-API-Key` → 401 | `frontend/e2e/gravitas.spec.ts` (Playwright, 10 tests) |
| `frontend/src/tests/backend-integration.test.js`, `recommendation-states.test.js` | Legacy unit helpers | Playwright suite |

**Baseline (2026-08-14):** 15/21 legacy scripts pass; 6 fail for the reasons above. See [docs/TESTING.md](TESTING.md) §8.

## 5. Removed / Renamed Components (no longer in code)

| Component | Gone since | Replacement |
|---|---|---|
| `enforcement_engine/` (enforcement decisions, `SAFE_REDIRECT`, `ALLOW`, `RESTRICT`) | TANTRA v3 (advisory) | `tantra/flow.py` recommendation types |
| `enhanced_legal_advisor.py` | Advisor rewrite | `legal_database/enhanced_legal_agent.py` |
| `query_legal(query, jurisdiction)` single-signature entry | Router refactor | `POST /nyaya/query` (schema-validated) |

## 6. Historical Folders (index only, do not rewrite)

`review_packet/`, `Phase6_Roadmap/`, `Tantra_Hacks_Day3/`, `D1/`, `D2/`, `D3/`, `run_tantra_tests/`, `audit_*`, `integrity_*`, `dataset_audit*`, `api/`, `evidence_audit/`, `postmortems/`, `risk_assessment/`, `security/`, `S1_Incident_Reports/`, `governance/` — these record project history (hackathons, audits, postmortems) and are retained as-is.

---

## 7. Known Findings Logged (NOT fixed — per project decision to document only)

| Finding | Severity | Where logged |
|---|---|---|
| `frontend/.env` commits a live `VITE_NYAI_API_KEY` | Security | [VALIDATION_REPORT.md](validation/VALIDATION_REPORT.md) §4 |
| `backend/tests/test_live_backend.py:11` embeds the same key | Security | [VALIDATION_REPORT.md](validation/VALIDATION_REPORT.md) §4 |
| Root README claimed "118 acts"; verified count is **121** (9,723 sections) | Doc accuracy | [VALIDATION_REPORT.md](validation/VALIDATION_REPORT.md) §2 |
| `backend/README.md` claims Python 3.7+ (actual: 3.11.x) | Doc accuracy | §2 above |
| Legacy `test_*.py` scripts drift from the current API | Maintenance | §4 above |
