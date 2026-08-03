# 🏛️ Nyaya AI (NYAI) — Sovereign Legal Intelligence Platform

Nyaya AI (NYAI) is a state-of-the-art, sovereign-compliant multi-agent legal intelligence platform. Designed to provide auditable and transparent legal reasoning, the system integrates legal analysis across multiple jurisdictions (India, UK, and UAE). It utilizes a modular agent architecture to deliver high-fidelity guidance under strict constitutional compliance constraints.

This document serves as the **definitive root reference** for understanding, testing, configuring, deploying, and running the NYAI project.

---

## 📊 Test Results Summary

A comprehensive validation of the latest codebase was conducted across both backend and frontend components, verifying authentication gates, input validations, output structures, and external integration continuity.

| Component / Phase | Test Suite | Scope | Result | Details |
|---|---|---|---|---|
| **Backend Unit & Integration** | `pytest` | 41 test modules in `backend/tests/` | ✅ **165 / 165 Passed** | Full coverage of provenance chain, outbox thread-safety, and ecosystem client behaviors. |
| **Frontend E2E** | `Playwright` | 10 tests in `frontend/e2e/gravitas.spec.ts` | ✅ **10 / 10 Passed** | Verified `trace_id` continuity, recommendation gatekeeping UI states, rendering fidelity, and error boundaries. |
| **Database Loading** | `verify_db_loading.py` | Local sqlite database verification | ✅ **9,723 Sections Loaded** | Ingested data across **118 unique acts** including **776 BNS**, **1259 IPC**, and **1272 CrPC** sections. |
| **Live API Smoke Check** | `_local_smoke_test.py` | Live API verification on Render hosting | ✅ **7 / 7 Passed** | Validated health check, auth gates (401 code), error structures (422 code), and trace rendering. |

---

## 🛠️ Pre-Deployment Requirements

Ensure that you have the following prerequisites configured before running or deploying NYAI:

### 1. Software Runtimes
* **Python**: `3.11.9` is required for production (specified in `backend/runtime.txt` for Render compatibility). Local tests can execute on Python `3.13.x`.
* **Node.js**: `v18.x` or higher (tested and verified on `v24.12.0`).
* **npm**: `v9.x` or higher.

### 2. External Integration Credentials (Secrets Manager)
* **GROQ API Key** (`GROQ_API_KEY`): Mandatory for full LLM-driven legal reasoning.
* **NYAI API Key** (`NYAI_API_KEY`): Core token authorizing communication between frontend client and backend gateway.
* **HMAC Secret Key** (`HMAC_SECRET_KEY`): Key for generating cryptographic event signatures in the provenance chain ledger.
* **InsightFlow API Key** (`INSIGHTFLOW_API_KEY`): Secret key allowing dataset metadata writes.

### 3. Upstream Authority Registrations
Before enabling live ecosystem communications, ensure collaborator permissions are aligned:
* **Bucket Writer Authority Matrix**: Siddhesh's team must add NYAI (`nyai.*` source module id) to `bucket/AUTHORITY_BOUNDARIES.md`.
* **BHIV Core Registry**: Raj's team must merge `backend/ecosystem/proposed_nyai_registry_entry.json` into Core's `TANTRA_INTEGRATION_REGISTRY.json`.
* **InsightFlow Metadata**: Vijay's team must confirm dataset canonical ID registration or complete onboarding-review via `POST /api/v1/onboarding/submit` on `bhiv-registry`.

---

## 🚀 How to Run (Local Environment)

Follow these instructions to start the development servers on your local machine:

### 1. Ingest Data and Setup Database
Ensure the legal dataset resides under `backend/db/` and run verification:
```bash
cd backend
python tests/verify_db_loading.py
```

### 2. Run the Backend
Configure local environment secrets in `backend/.env` (see Configuration below), then launch uvicorn:
* **Windows (Batch Script):**
  ```cmd
  cd backend
  start_backend.bat
  ```
* **Any OS (Uvicorn Manual Command):**
  ```bash
  cd backend
  python -m uvicorn api.main:app --host 0.0.0.0 --port 8000 --reload
  ```
* *Documentation will be live at: http://localhost:8000/docs (Swagger) or http://localhost:8000/redoc (ReDoc).*

### 3. Run the Frontend
Vite runs the frontend on port `3000` (configured in `vite.config.js` with proxies matching port `8000` for backend traffic):
```bash
cd frontend
npm install
npm run dev
```
* *Access the client UI in your browser at: http://localhost:3000*

---

## ⚙️ Configuration & Environment Variables

All feature options, endpoints, and credentials are governed by environment configurations. 

### Backend Environment Variables (`backend/.env`)

| Category | Key | Default / Sample Value | Purpose |
|---|---|---|---|
| **Server** | `HOST` \| `PORT` | `0.0.0.0` \| `8000` | Gateway host binding and port. |
| **Authentication** | `NYAI_API_KEY` | `your-secret-api-key-here` | Key to authorize requests. Rejection yields HTTP `401 INVALID_API_KEY`. |
| **Rate Limiting** | `RATE_LIMIT_PER_MINUTE` | `60` | Limit per client token (sliding window implementation). |
| **Security** | `ENABLE_DEBUG_ROUTES` | `false` | Set `true` only for dev to expose `/debug/*` paths. |
| **LLM** | `GROQ_API_KEY` \| `GROQ_MODEL` | `gsk_...` \| `llama-3.1-8b-instant` | Key and model for Groq API retrieval. |
| **Provenance** | `HMAC_SECRET_KEY` \| `SIGNING_METHOD` | `change-me-in-production` \| `HMAC_SHA256` | Secret to sign provenance ledger events. |
| **Data Directories** | `INPUT_DIRECTORY` \| `OUTPUT_DIRECTORY` | `db` \| `output` | DB ingestion inputs and outbox log outputs. |
| **Bucket Integration** | `BUCKET_ENDPOINT` \| `BUCKET_PRODUCER_ENABLED` | `https://bhiv-bucket-i1l6.onrender.com` \| `false` | Target endpoint and feature toggle. |
| **Core Integration** | `BHIV_CORE_ENDPOINT` \| `BHIV_CORE_ENABLED` | `http://localhost:8003` \| `false` | Target endpoint and registry participate toggle. |
| **InsightFlow** | `INSIGHTFLOW_ENDPOINT` \| `INSIGHTFLOW_ENABLED` | `https://bhiv-mdu-api.onrender.com` \| `false` | Target telemetry endpoint and telemetry log toggle. |
| **CLO Integration** | `CLO_ENDPOINT` \| `CLO_ENABLED` | `https://shakti-gc-infra.onrender.com` \| `false` | Target ontology endpoint and ingestion sync toggle. |
| **Samachar/SVACS** | `SAMACHAR_ENDPOINT` \| `SAMACHAR_ENABLED` | `https://bhiv-svacs.onrender.com` \| `false` | Signal listener endpoint and webhook sync toggle. |

### Frontend Environment Variables (`frontend/.env.local`)
* `VITE_API_URL`: `http://localhost:3000` *(Local dev proxy)* or `https://nyai-backend-n9h8.onrender.com` *(Production Render URL)*.
* `VITE_NYAI_API_KEY`: Core token authorizing requests against the gateway, matching the backend configuration.

---

## 🧪 Complete Testing Procedures

Run these command suites to execute a clean verification pass:

### 1. Running Backend pytest Suite
Make sure to ignore the local CPU FAISS testing module if FAISS binary is not installed:
```bash
cd backend
python -m pytest tests/ --ignore=tests/test_faiss_search.py -v
```

### 2. Running Frontend E2E Suite
First compile the client code, then boot the dev server and test using Playwright:
```bash
cd frontend
npm run build
npx playwright test --project=chromium
```
* *For visual tracing of errors, execute: `npx playwright test --ui`.*

### 3. Run Production Smoke Check
Verify live/local server paths against all status code conditions:
```bash
cd backend
# Specify target test server in SMOKE_BASE_URL
$env:SMOKE_BASE_URL="https://nyai-backend-n9h8.onrender.com"
python _local_smoke_test.py
```

---

## 🚀 Deployment Process (A-to-Z Guide)

Follow this sequence to roll out changes to staging/production:

### Backend Deployment (Render Cloud)
1. **GitHub Connection**: Hook your repository up to Render Dashboard. Select **New Web Service**.
2. **Runtime Configuration**: Set environment type to **Python**. Render automatically detects `backend/runtime.txt` to select Python version `3.11.9`.
3. **Build & Start commands**:
   * Build Command: `pip install -r requirements.txt` (or execute `bash build.sh` to compile PyTorch CPU version safely without CUDA overheads).
   * Start Command: `uvicorn api.main:app --host 0.0.0.0 --port $PORT`
4. **Persistent Disk Attachment**:
   * Go to **Dashboard → Disks**. Create a persistent disk of size `1GB` or more.
   * Set the mount path to `/var/data`.
5. **Environment Configuration**:
   * Go to **Environment** tab. Paste settings matching `backend/deploy/render.production.env.example`.
   * Set `OUTPUT_DIRECTORY=/var/data` and `PROVENANCE_LEDGER_PATH=/var/data/provenance_ledger.json` so ledger files persist across Render server restarts.
6. **Deploy**: Trigger a manual redeploy.

### Frontend Deployment (Vercel)
1. **Import Project**: Select the `frontend` folder inside Vercel Dashboard import.
2. **Build Settings**: Configure framework as **Vite**, build command as `npm run build`, and output folder as `dist`.
3. **Environment Variables**: Define Vercel environment variables corresponding to `frontend/deploy/vercel.production.env.example`:
   * `VITE_API_URL` (Points to deployed Render backend URL)
   * `VITE_NYAI_API_KEY` (Matches Render backend API key exactly)
4. **Deploy**: Push build and confirm routing. SPA routing fallback is handled automatically by Vercel according to configurations in `frontend/vercel.json`.

---

## 🔍 Troubleshooting Guide

Here are common runtime issues and their diagnostic solutions:

### 1. Slow Server Startup / Request Timeouts
> [NOTE]
> Render free-tier containers automatically sleep after 15 minutes of inactivity. The first query sent to a spun-down server can take 50+ seconds to boot, causing client-side timeouts.
* **Fix**: If using free hosting, send a dummy GET request to `/health` to wake up the server before querying `/nyaya/query`. For production, configure the Render service tier to "Individual" or above to disable auto-sleeping.

### 2. Missing `faiss` Library Warning on Startup
> [WARNING]
> Running the python dependency check script shows `Missing: faiss`.
* **Fix**: FAISS is a CPU-intensive vector lookup indexing service. If semantic search is disabled (`SEMANTIC_SEARCH_ENABLED=false` in `.env`), this module is not imported in normal code paths and will not cause errors. Use the `--ignore=tests/test_faiss_search.py` option to run the test suite cleanly without installing the FAISS compiler package.

### 3. Duplicate Telemetry Logs (HTTP 409)
> [IMPORTANT]
> The bhiv-registry API returns a `409 Conflict` if the canonical dataset ID `"nyai.legal_query_runtime"` is registered on every query.
* **Fix**: The telemetry client in `backend/ecosystem/insightflow_publisher.py` handles this cleanly. It caches the registered `dataset_id` upon the initial boot, handles 409 conflict exceptions through local recovery, and writes append-only event logs to the `/api/v1/datasets/{dataset_id}/provenance` path, preventing request failures.

### 4. Hardcoded System Paths in Startup Scripts
> [CAUTION]
> Running `start_enhanced_backend.py` crashes due to hardcoded path: `os.chdir(r"c:\Users\Gauri\Desktop...")`.
* **Fix**: Start the server using `start_backend.bat` (which dynamically checks working folders via relative batch parameters `%~dp0`) or execute `python -m uvicorn api.main:app --reload` directly from the backend folder.
