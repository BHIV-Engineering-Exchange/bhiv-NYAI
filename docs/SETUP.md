# NYAI — Setup Guide

> How to install, configure, and run the NYAI platform locally. Production deployment is covered in [Deployment](DEPLOYMENT.md).

---

## 1. Prerequisites

### Hardware / Software

| Component | Requirement | Verified |
|---|---|---|
| OS | Windows 10/11, macOS, Linux | ✅ |
| Python | **3.11.x for production** (pin `backend/runtime.txt` = `3.11.9`). Local dev/test verified on **3.13.7**. | ✅ |
| Node.js | **v18+** (verified on **v24.12.0**) | ✅ |
| npm | **v9+** (verified on 11.10.0) | ✅ |
| Disk | ~1 GB free for datasets + venv; 1 GB+ persistent disk on Render for `/var/data` | ✅ |
| RAM | Backend: 512 MB–1 GB+ (torch/sentence-transformers/FAISS optional). Free-tier Render OK without FAISS. | ✅ |

> **FAISS note**: FAISS is optional. If `SEMANTIC_SEARCH_ENABLED=false`, the FAISS module is not imported in normal paths. Installing the faiss binary requires compilation and is not needed to run or test the platform.

### Accounts / Services (optional for local, required for full LLM & ecosystem)

| Service | Purpose | Env var(s) |
|---|---|---|
| Groq | LLM answer generation + retrieval augmentation | `GROQ_API_KEY`, `GROQ_MODEL` |
| Render | Production backend hosting | `NYAI_API_KEY`, `HMAC_SECRET_KEY`, … |
| Vercel | Production frontend hosting | `VITE_API_URL`, `VITE_NYAI_API_KEY` |
| (Ecosystem) | Bucket / Core / InsightFlow / CLO / SVACS | Phase VI flags (all default **false**) |

---

## 2. Clone & Verify

```bash
git clone <repo-url> NYAI
cd NYAI
git status                # should be on main
git log --oneline -5      # sanity check
```

---

## 3. Backend Setup

### 3.1 Create virtual environment

```bash
cd backend
python -m venv .venv
# Windows:
.\.venv\Scripts\activate
# macOS/Linux:
source .venv/bin/activate
```

> A venv is recommended but optional — the repo has no committed venv.

### 3.2 Install dependencies

```bash
pip install -r requirements.txt
```

> If `torch` is heavy for your machine, run the CPU-only build script instead:
> ```bash
> bash build.sh
> ```
> (On Windows, use Git Bash or install torch CPU wheels manually per `requirements.txt`.)

### 3.3 Configure secrets — `backend/.env`

Copy the template and fill in values:

```bash
cp .env.example .env
```

**Minimum required for protected endpoints to work:**
```
NYAI_API_KEY=your-secret-api-key-here        # REQUIRED — without it protected routes return 503
```

**Strongly recommended:**
```
GROQ_API_KEY=gsk_...                         # LLM answers (falls back to local otherwise)
GROQ_MODEL=llama-3.1-8b-instant
HMAC_SECRET_KEY=<strong-random-secret>       # signs provenance events
```

The repo ships a working `backend/.env` for local development; **never commit real secrets**. `backend/.env` is git-ignored.

### 3.4 Optional — generate an ecosystem read key

```bash
python -c "import secrets; print(secrets.token_urlsafe(32))"
# → ECOSYSTEM_READ_API_KEY=<generated>
```

---

## 4. Frontend Setup

```bash
cd frontend
npm install
```

### Configure `frontend/.env.local` (local dev)

```
VITE_API_URL=http://localhost:8000
VITE_NYAI_API_KEY=<same-as-backend-NYAI_API_KEY>
```

> `VITE_API_URL` for local dev can be `http://localhost:3000` (uses the Vite proxy to `:8000`) or `http://localhost:8000` (direct). Production uses the Render URL — see [Deployment](DEPLOYMENT.md).

---

## 5. Data Preparation (first run)

Legal datasets ship in `backend/db/` (70 JSON files, 9,723 sections). Verify the database loads:

```bash
cd backend
python tests/verify_db_loading.py
```

Expected: `Total sections loaded: 9723` across `121 unique acts`, with BNS 776 / IPC 1259 / CrPC 1272.

> Optional: build the FAISS index for semantic search:
> ```bash
> cd backend
> python build_faiss_index.py
> ```
> Requires the faiss package and `data/vector_index/` output.

---

## 6. Run Locally

### Backend

```bash
cd backend
start_backend.bat              # Windows — dynamic folder detection
# or any OS:
python -m uvicorn api.main:app --host 0.0.0.0 --port 8000 --reload
```

Access points:
- API info: `http://localhost:8000/`
- Swagger UI: `http://localhost:8000/docs`
- ReDoc: `http://localhost:8000/redoc`
- Health: `http://localhost:8000/health`

### Frontend

```bash
cd frontend
npm run dev
```

Access: `http://localhost:3000`

---

## 7. Secret Management Guidelines

| Rule | Why |
|---|---|
| Never commit `.env` files | They contain live credentials |
| Keep `backend/.env` and `frontend/.env.local` in `.gitignore` | Already configured |
| Use environment variables in Render/Vercel dashboards, not files | Server-side, not baked into client |
| Rotate `VITE_NYAI_API_KEY` if it has been committed | Vite bakes `VITE_*` into the client bundle at build time — it is visible to anyone |
| Use a unique `HMAC_SECRET_KEY` per environment | Event signatures must be environment-specific |
| Use per-service keys (Groq, InsightFlow, ECOSYSTEM_READ) | Least-privilege access |

> ⚠️ **Known issue (flagged, not code-fixed)**: `frontend/.env` and `backend/tests/test_live_backend.py:11` contain a live API key value. Rotate this key if the repo is public. See [Validation Report](validation/VALIDATION_REPORT.md) §4.

---

## 8. Verify Your Setup Works

Run the smoke test (requires the backend running on `:8000`):

```bash
cd backend
python _local_smoke_test.py
```

Expected output: `Summary: 7/7 smoke checks passed`.

Then run the full suites — see [Testing](TESTING.md).
