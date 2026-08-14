# NYAI — Documentation Hub

> **This is the single source of truth for the NYAI platform.** Every developer-facing topic — setup, architecture, testing, environment configuration, API reference, and deployment — is consolidated here. The root [`README.md`](../README.md) is the entry point; this hub is where the detail lives.

---

## 📚 Documentation Map

| Guide | Purpose | Audience |
|---|---|---|
| [**Architecture**](ARCHITECTURE.md) | System design, module inventory, request lifecycle, middleware chain | Architects, new contributors |
| [**Setup**](SETUP.md) | Prerequisites, installation, environment configuration, secret management | Developers onboarding |
| [**API Reference**](API_REFERENCE.md) | Every endpoint, authentication, HTTP status codes, request/response examples | Frontend & integration developers |
| [**Environment Variables**](ENVIRONMENT_VARIABLES.md) | Complete, code-verified registry of all configuration keys | DevOps, platform engineers |
| [**Testing**](TESTING.md) | How to run every test suite and validate the system | QA, developers, reviewers |
| [**Deployment**](DEPLOYMENT.md) | A-to-Z production deployment walkthrough (Render + Vercel) | DevOps, release managers |
| [**Documentation Index**](DOCUMENTATION_INDEX.md) | Map of every module, file, and existing documentation in the repo | Everyone navigating the codebase |
| [**Archive**](ARCHIVE.md) | Registry of deprecated/obsolete documents and external integration repos | Historians, audit reviewers |
| [**Validation Report**](validation/VALIDATION_REPORT.md) | Evidence of the full end-to-end test execution | QA, reviewers, auditors |

---

## 🧭 How to Navigate

- **New to the project?** Start at [`README.md`](../README.md), then read [Architecture](ARCHITECTURE.md) → [Setup](SETUP.md).
- **Need to run the system?** Follow [Setup](SETUP.md) → [Testing](TESTING.md).
- **Building against the API?** Read [API Reference](API_REFERENCE.md).
- **Shipping to production?** Read [Deployment](DEPLOYMENT.md) end-to-end.
- **Looking for a specific file?** Search [Documentation Index](DOCUMENTATION_INDEX.md).
- **Found a stale doc?** It should be listed in [Archive](ARCHIVE.md), not deleted.

---

## ✅ Current Validation Status (2026-08-14)

| Suite | Command | Result |
|---|---|---|
| Backend pytest (`tests/`) | `python -m pytest tests/ --ignore=tests/test_faiss_search.py -v` | **165 / 165 passed** |
| Database loading | `python tests/verify_db_loading.py` | **9,723 sections / 121 acts** |
| Local smoke test | `python _local_smoke_test.py` | **7 / 7 passed** |
| Live production smoke test | `python _local_smoke_test.py` (Render URL) | **7 / 7 passed** |
| Live production pytest | `tests/test_live_backend.py` (in suite) | **7 / 7 passed** |
| Frontend build | `npm run build` | **OK (184 modules)** |
| Frontend E2E (Playwright) | `npx playwright test --project=chromium` | **10 / 10 passed** |
| TANTRA v3 contract | manual validation vs `final_decision_contract.json` | **All 11 required fields present** |

> Full evidence: [Validation Report](validation/VALIDATION_REPORT.md).

---

## 🏛️ Project at a Glance

- **Repo**: `NYAI` (git, `main` branch)
- **Backend**: FastAPI + Python (prod pin `3.11.9`, local `3.13.x` tested) — `backend/api/main.py`
- **Frontend**: React 18 + Vite 7 — `frontend/`
- **Canonical contract**: `final_decision_contract.json` v2.0.0 — `schema_version: tantra_v3`
- **Recommendation model**: advisory only (`INFORM | REVIEW | ESCALATE | INSUFFICIENT_DATA`) — no enforcement gate
- **Jurisdictions**: India (IN), UK, UAE, KSA
- **Live endpoints**: Backend `https://nyai-backend-n9h8.onrender.com` · Frontend Vercel

---

*Last updated: 2026-08-14 · Maintained as part of the NYAI documentation modernization effort.*
