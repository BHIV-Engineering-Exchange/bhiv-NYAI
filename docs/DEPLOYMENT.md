# NYAI — Deployment & Operations Guide (A–Z)

> The definitive, step-by-step manual for deploying and operating NYAI in production. Companion guides: [Setup](SETUP.md) (local), [Testing](TESTING.md) (validation), [Environment Variables](ENVIRONMENT_VARIABLES.md) (config registry).

---

## Table of Contents
1. [Pre-requisites](#1-pre-requisites)
2. [Setup: Environment & Secrets](#2-setup-environment--secrets)
3. [Execution: Running Locally & In Production](#3-execution-running-locally--in-production)
4. [Validation: Verifying the System](#4-validation-verifying-the-system)
5. [Deployment: Backend (Render)](#5-deployment-backend-render)
6. [Deployment: Frontend (Vercel)](#6-deployment-frontend-vercel)
7. [Post-Deployment Verification](#7-post-deployment-verification)
8. [Operations: Scaling, Monitoring, Troubleshooting](#8-operations-scaling-monitoring-troubleshooting)
9. [Rollback & Recovery](#9-rollback--recovery)

---

## 1. Pre-requisites

### Hardware
| Resource | Minimum | Recommended |
|---|---|---|
| CPU | 1 core | 2+ cores |
| RAM | 512 MB (no FAISS) | 1–2 GB |
| Disk | 1 GB code + data | 1 GB+ persistent disk for `/var/data` |
| Network | HTTPS egress to Groq/Render | — |

### Software
| Tool | Version | Verified |
|---|---|---|
| Python | **3.11.x** (production pin `backend/runtime.txt` = `3.11.9`) | ✅ |
| Node.js | **v18+** | ✅ v24.12.0 |
| npm | **v9+** | ✅ 11.10.0 |
| Git | any recent | ✅ |

> **Important**: Render selects the Python version from `backend/runtime.txt`. Do not set 3.12/3.13 for production — `.env.example` warns `PYTHON_VERSION=3.11.x` (not 3.14).

### Accounts & Services
- **GitHub** repo hosting NYAI.
- **Render** account (backend web service).
- **Vercel** account (frontend static hosting).
- **Groq** API key (LLM).
- *(Ecosystem, optional — Phase VI)* Bucket, BHIV Core, InsightFlow, CLO/SHAKTI, SVACS credentials.

---

## 2. Setup: Environment & Secrets

### 2.1 Clone
```bash
git clone <repo> NYAI && cd NYAI
```

### 2.2 Backend secrets — `backend/.env`
```bash
cd backend
cp .env.example .env
```
Fill in (production values must be unique/rotated):
```
NYAI_API_KEY=<strong-random>            # REQUIRED (fail-closed → 503 if unset)
HMAC_SECRET_KEY=<strong-random>         # signs provenance events
GROQ_API_KEY=gsk_...                    # LLM answers
GROQ_MODEL=llama-3.1-8b-instant
FRONTEND_URL=https://<your-frontend>.vercel.app
ENABLE_DEBUG_ROUTES=false
```

### 2.3 Frontend secrets — `frontend/.env.production`
```bash
cd frontend
# .env.production (used by `npm run build` for prod)
VITE_API_URL=https://<your-backend>.onrender.com
VITE_NYAI_API_KEY=<same-value-as-Render NYAI_API_KEY>
```
> `VITE_NYAI_API_KEY` must **exactly** match the backend `NYAI_API_KEY` or all `/nyaya/*` calls will fail with `401`.

### 2.4 Secret management rules
- Never commit `.env*` files containing real secrets (all git-ignored).
- Use the provider dashboards (Render/Vercel) for production secrets — Vite bakes `VITE_*` into the client bundle at build time, so it is public; `NYAI_API_KEY`/`HMAC_SECRET_KEY`/`GROQ_API_KEY` stay server-side.
- Rotate any key that has ever been committed (see [Validation Report](validation/VALIDATION_REPORT.md) §4).

---

## 3. Execution: Running Locally & In Production

### 3.1 Local development
```bash
# Backend
cd backend && start_backend.bat        # or: python -m uvicorn api.main:app --host 0.0.0.0 --port 8000 --reload
# Frontend
cd frontend && npm install && npm run dev   # http://localhost:3000
```
Docs: `http://localhost:8000/docs` (Swagger) · `http://localhost:8000/redoc` (ReDoc).

### 3.2 Production process model
- **Backend**: one Uvicorn web service on Render (start command below), with a **persistent disk** mounted at `/var/data` for the output bucket + provenance ledger.
- **Frontend**: static `dist/` served by Vercel with SPA fallback (`frontend/vercel.json`).

---

## 4. Validation: Verifying the System

Run every check below and confirm the expected result **before** deploying, and again **after** deploying (pointing at the live URLs).

| # | Check | Command | Pass criterion |
|---|---|---|---|
| 1 | Backend unit+integration | `cd backend && python -m pytest tests/ --ignore=tests/test_faiss_search.py -v` | **165 passed** |
| 2 | Database load | `python tests/verify_db_loading.py` | `Total sections loaded: 9723`, BNS 776 / IPC 1259 / CrPC 1272 |
| 3 | Local smoke | `python _local_smoke_test.py` (server on :8000) | **7/7 PASS** |
| 4 | Live smoke | `$env:SMOKE_BASE_URL="https://<backend>.onrender.com"; python _local_smoke_test.py` | **7/7 PASS** |
| 5 | Frontend build | `cd frontend && npm run build` | exit 0, `dist/` produced |
| 6 | Frontend E2E | `npx playwright test --project=chromium` | **10/10 passed** |
| 7 | Health | `curl https://<backend>.onrender.com/health` | `{"status":"healthy"}` |
| 8 | Auth gate | `POST /nyaya/query` with no/bad key | `401` |
| 9 | Schema | valid `/nyaya/query` | `200` + `schema_version: tantra_v3`, `recommendation.type` set |

---

## 5. Deployment: Backend (Render)

### 5.1 Create the web service
1. Render Dashboard → **New → Web Service**.
2. Connect the GitHub repo (branch `main`).
3. **Name**: e.g. `nyai-backend`.
4. **Environment**: Python.

### 5.2 Runtime & build settings
| Field | Value |
|---|---|
| Python version | Auto-detected from `backend/runtime.txt` (`3.11.9`) |
| Root directory | `backend` |
| Build command | `pip install -r requirements.txt` — or `bash build.sh` for a CPU-only torch build |
| Start command | `uvicorn api.main:app --host 0.0.0.0 --port $PORT` |

### 5.3 Attach a persistent disk (critical)
1. Render Dashboard → **Disks → Add Disk** for this service.
2. Size: **1 GB+** (e.g. 1 GB free tier).
3. Mount path: **`/var/data`**.

This persists the output bucket (`OUTPUT_DIRECTORY`) and provenance ledger across restarts. **Without it, all evidence/provenance data is lost on every redeploy.**

### 5.4 Environment variables (Render → Environment tab)
Paste values matching `backend/deploy/render.production.env.example`:
```
NYAI_API_KEY=<same-as-Vercel VITE_NYAI_API_KEY>
FRONTEND_URL=https://<your-frontend>.vercel.app
GROQ_API_KEY=<your-groq-key>
HMAC_SECRET_KEY=<strong-unique-secret>
OUTPUT_DIRECTORY=/var/data
PROVENANCE_LEDGER_PATH=/var/data/provenance_ledger.json
RATE_LIMIT_PER_MINUTE=60
ENABLE_DEBUG_ROUTES=false
```
> ⚠️ `OUTPUT_DIRECTORY=/var/data` and `PROVENANCE_LEDGER_PATH=/var/data/provenance_ledger.json` must point at the disk mount path.

### 5.5 Deploy
- **Manual**: Render → service → **Deploy** (or push to `main`).
- **Verification**: after startup, `https://<backend>.onrender.com/health` must return `{"status":"healthy"}` and `/docs` must load.

---

## 6. Deployment: Frontend (Vercel)

1. Vercel Dashboard → **Add New → Project** → Import the GitHub repo.
2. **Root directory**: `frontend`.
3. **Framework preset**: Vite.
4. **Build command**: `npm run build` · **Output directory**: `dist`.
5. **Environment variables** (Production):
   ```
   VITE_API_URL=https://<backend>.onrender.com
   VITE_NYAI_API_KEY=<same-as-Render-NYAI_API_KEY>
   ```
6. **Deploy**. SPA fallback is handled by `frontend/vercel.json` (Vite rewrite).

> Redeploy after changing any `VITE_*` variable — they are baked in at build time.

---

## 7. Post-Deployment Verification

Run the [Validation checks from §4](#4-validation-verifying-the-system) against the live URLs:
1. `https://<backend>.onrender.com/health` → `healthy`
2. `https://<backend>.onrender.com/health/ready` → `200/503` with dependency details
3. Live smoke test → `7/7`
4. Live `POST /nyaya/query` → `200`, `recommendation.type` present, `observer_validation.validation_status = "PASS"`
5. `https://<frontend>.vercel.app` → UI loads; a query returns a rendered decision with a `trace_id`.

---

## 8. Operations: Scaling, Monitoring, Troubleshooting

### Scaling
- **Backend**: upgrade Render instance type as load grows; increase disk if ledger/bucket grows large. Rate limits (`RATE_LIMIT_PER_MINUTE`/`BURST`) protect the free tier.
- **Frontend**: Vercel scales statically; no action needed.

### Monitoring
- `GET /metrics` — request counters, uptime, auth failures, rate-limit hits.
- `GET /health/ready` — per-dependency status (bucket, ledger, advisor, GROQ, evidence, knowledge, ecosystem).
- Structured JSON logs (StructuredLoggingMiddleware) include `trace_id` for every request.

### Troubleshooting
| Symptom | Likely cause | Fix |
|---|---|---|
| First query takes 50+ s on free tier | Render auto-sleep after 15 min idle | Send `GET /health` to wake; upgrade to paid tier |
| All `/nyaya/*` return `503 AUTH_CONFIGURATION_ERROR` | `NYAI_API_KEY` not set on server | Set it in Render env; redeploy |
| Frontend queries return `401` | `VITE_NYAI_API_KEY` ≠ `NYAI_API_KEY` | Align both values; rebuild Vercel |
| `Missing: faiss` dependency warning | FAISS not installed | Expected when `SEMANTIC_SEARCH_ENABLED=false`; not imported in normal paths |
| InsightFlow `409 Conflict` on registration | Dataset already registered | `insightflow_publisher.py` handles 409 via canonical lookup + local fallback (append-only) |
| Hardcoded-path crash on Windows | `start_enhanced_backend.py` stale `c:\Users\Gauri\...` path | Use `start_backend.bat` or `python -m uvicorn api.main:app` from `backend/` |
| Duplicate telemetry / write failures | Ecosystem flag enabled without credentials | Keep `*_ENABLED=false` until approvals & keys are in place (`review_packet/enablement_checklist.md`) |

---

## 9. Rollback & Recovery

- **Backend (Render)**: Deploy → **Deploy another commit/branch** to a known-good commit; or use Render’s "Rollback to previous deploy". The persistent disk retains `/var/data` ledger + bucket across deploys.
- **Frontend (Vercel)**: Vercel → **Deployments** → select previous deployment → **Promote to Production**.
- **Data recovery**: output bucket JSONL under `/var/data` (or `backend/output/`) is append-only; provenance ledger at `PROVENANCE_LEDGER_PATH` reconstructs the hash chain. Use `/evidence/verify` and `/evidence/verify/chain` to prove integrity after recovery.

---

## Appendix A — Production Config Templates

**`backend/deploy/render.production.env.example`** (canonical):
```
NYAI_API_KEY=<same-as-Vercel-VITE_NYAI_API_KEY>
FRONTEND_URL=https://frontend-xi-three-imewbfjyjk.vercel.app
GROQ_API_KEY=<your-groq-key>
HMAC_SECRET_KEY=<strong-unique-secret>
OUTPUT_DIRECTORY=/var/data
PROVENANCE_LEDGER_PATH=/var/data/provenance_ledger.json
RATE_LIMIT_PER_MINUTE=60
ENABLE_DEBUG_ROUTES=false
PYTHON_VERSION=3.11.9
```

**`frontend/deploy/vercel.production.env.example`** (canonical):
```
VITE_API_URL=https://nyai-backend-n9h8.onrender.com
VITE_NYAI_API_KEY=<same-as-Render-NYAI_API_KEY>
```

## Appendix B — Containerized Deployment (optional)

The repo also ships `backend/Dockerfile` (`python:3.11-slim`) and `backend/docker-compose.yml`. Build/run:
```bash
docker build -t nyai-backend backend
docker run -p 8000:8000 -v nyai_data:/var/data -e NYAI_API_KEY=... nyai-backend
```
Persist `/var/data` (or `OUTPUT_DIRECTORY`) with a volume for the same durability guarantees.

---

*Last verified 2026-08-17 against the deployed production endpoints.*
