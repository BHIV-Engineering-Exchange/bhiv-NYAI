# 🔗 Nyaya AI — Integration Plan

> 🗄️ **HISTORICAL RECORD** — Dated 2026-04-16. This integration plan documents the original cross-repo integration strategy and is kept for reference. The current system has since moved to TANTRA v3; authoritative docs live in the [docs/ hub](docs/README.md).

> **Date**: April 16, 2026  
> **Status**: Ready for Execution  
> **Prerequisite**: Read `DISCLOSURE_REPORT.md` for full system analysis

---

## Executive Summary

This plan integrates the Nyaya AI frontend (React/Vite) with the backend (FastAPI/Python) into a fully functional, deployment-ready system. Work is divided into **5 phases**, each building on the previous.

---

## Phase 1: Backend — Add Missing API Endpoints

**Goal**: Create the 7 endpoints the frontend already calls but the backend doesn't have.

### 1.1 Add `/nyaya/case_summary` endpoint

| Detail | Value |
|--------|-------|
| **File** | `backend/api/router.py` |
| **Method** | `GET /nyaya/case_summary?trace_id={trace_id}` |
| **Data Source** | Extract from stored trace data (query response cache) |
| **Returns** | `{ case_type, jurisdiction, domain, key_statutes[], confidence, summary_text }` |

**Implementation**: Cache each `/nyaya/query` response by `trace_id` in memory dict. The case_summary endpoint reads from cache and returns a summarized view.

---

### 1.2 Add `/nyaya/legal_routes` endpoint

| Detail | Value |
|--------|-------|
| **File** | `backend/api/router.py` |
| **Method** | `GET /nyaya/legal_routes?trace_id={trace_id}` |
| **Data Source** | `legal_route` + `reasoning_trace` from cached response |
| **Returns** | `{ routes: [{ name, description, suitability_score, steps[] }] }` |

---

### 1.3 Add `/nyaya/timeline` endpoint

| Detail | Value |
|--------|-------|
| **File** | `backend/api/router.py` |
| **Method** | `GET /nyaya/timeline?trace_id={trace_id}` |
| **Data Source** | `timeline` field from enriched response (`core/response/enricher.py`) |
| **Returns** | `{ steps: [{ step, eta, milestone_number }] }` |

---

### 1.4 Add `/nyaya/glossary` endpoint

| Detail | Value |
|--------|-------|
| **File** | `backend/api/router.py` |
| **Method** | `GET /nyaya/glossary?trace_id={trace_id}` |
| **Data Source** | `glossary` field from enriched response |
| **Returns** | `{ terms: [{ term, definition }] }` |

---

### 1.5 Add `/nyaya/jurisdiction_info` endpoint

| Detail | Value |
|--------|-------|
| **File** | `backend/api/router.py` |
| **Method** | `GET /nyaya/jurisdiction_info?jurisdiction={code}` |
| **Data Source** | Static metadata for IN/UK/UAE/KSA |
| **Returns** | `{ code, name, legal_system, court_structure, key_acts[] }` |

---

### 1.6 Add `/nyaya/enforcement_status` endpoint

| Detail | Value |
|--------|-------|
| **File** | `backend/api/router.py` |
| **Method** | `GET /nyaya/enforcement_status?trace_id={trace_id}` |
| **Data Source** | Enforcement engine decision from cached response |
| **Returns** | `{ decision, rule_id, policy_source, reasoning, proof_hash }` |

---

### 1.7 Add `/nyaya/rl_signal` endpoint

| Detail | Value |
|--------|-------|
| **File** | `backend/api/router.py` |
| **Method** | `POST /nyaya/rl_signal` |
| **Data Source** | Wire to `rl_engine/reward_engine.py` + `governed_execution/pipeline.py` |
| **Body** | `{ trace_id, signal_type, user_feedback, outcome_tag }` |
| **Returns** | `{ accepted: bool, reason: string }` |

**Implementation**: Use `GovernedExecutionPipeline.update_rl_with_governance()` to gate the RL update through enforcement controls.

---

### 1.8 Response Cache Implementation

All `/nyaya/case_summary`, `/legal_routes`, `/timeline`, `/glossary`, `/enforcement_status` endpoints depend on cached query responses:

```python
# Add to router.py
from collections import OrderedDict
import threading

class ResponseCache:
    """Thread-safe LRU response cache for trace_id lookups"""
    def __init__(self, max_size=500):
        self.cache = OrderedDict()
        self.max_size = max_size
        self.lock = threading.Lock()
    
    def set(self, trace_id: str, response: dict):
        with self.lock:
            self.cache[trace_id] = response
            if len(self.cache) > self.max_size:
                self.cache.popitem(last=False)
    
    def get(self, trace_id: str) -> dict | None:
        with self.lock:
            return self.cache.get(trace_id)

response_cache = ResponseCache()
```

In the existing `/nyaya/query` handler, add `response_cache.set(trace_id, response_data)` after building the response.

---

## Phase 2: Frontend — Consolidate API Layer

**Goal**: Remove redundant API client, fix environment variables, clean up stale files.

### 2.1 Remove `nyayaBackendApi.js`

| Action | Details |
|--------|---------|
| **Delete** | `frontend/src/services/nyayaBackendApi.js` |
| **Update** | Any imports referencing `nyayaBackendApi` → use `nyayaApi.js` services |
| **Why** | Hardcodes Render URL, duplicates `nyayaApi.js` functionality |

**Affected files**: Search all components for imports from `nyayaBackendApi.js` and redirect to `nyayaApi.js`:
```bash
# Find all references
grep -rn "nyayaBackendApi" frontend/src/
```

---

### 2.2 Fix Environment Variable in `vercel.json`

**Current** (wrong):
```json
{
  "env": {
    "NEXT_PUBLIC_API_URL": "https://nyaya-ai-0f02.onrender.com"
  }
}
```

**Fixed**:
```json
{
  "env": {
    "VITE_API_URL": "https://nyaya-ai-0f02.onrender.com"
  }
}
```

---

### 2.3 Update `apiConfig.ts` for local dev

Ensure `apiConfig.ts` properly supports both environments:

```typescript
export const BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';
```

---

### 2.4 Fix Vite Proxy Configuration

Update `vite.config.js` to properly proxy `/nyaya` prefix (not just `/api`):

```javascript
export default defineConfig({
  server: {
    proxy: {
      '/nyaya': {
        target: 'http://localhost:8000',
        changeOrigin: true
      },
      '/health': {
        target: 'http://localhost:8000',
        changeOrigin: true
      }
    }
  }
})
```

---

### 2.5 Delete Stale Files

```
DELETE: frontend/src/App_Old_Backup.jsx
DELETE: frontend/src/App_New.jsx
DELETE: frontend/src/components/LegalQueryCard_BACKUP.jsx
DELETE: backend/api/router_broken.py
DELETE: backend/frontend/  (empty folder)
```

---

## Phase 3: Environment & Security Configuration

**Goal**: Secure secrets, create proper env files, restrict CORS.

### 3.1 Rotate Exposed Groq API Key

The key `gsk_3svA2X5BqGYxe6b78f2z...` is exposed in the `.env` file. Steps:
1. Go to Groq console → Revoke current key
2. Generate new API key
3. Set it ONLY in Render dashboard environment variables
4. Remove from `.env` file

### 3.2 Create `.env.example` Files

**Backend** (`backend/.env.example`):
```env
# Server
HOST=0.0.0.0
PORT=8000

# Security (CHANGE IN PRODUCTION)
HMAC_SECRET_KEY=change-me-in-production
SIGNING_METHOD=HMAC_SHA256
SIGNING_KEY_ID=primary-key-2025

# Database
DATABASE_URL=sqlite:///./nyaya.db

# Logging
LOG_LEVEL=info

# Groq LLM (optional)
GROQ_ENABLED=true
GROQ_API_KEY=your-groq-api-key-here
GROQ_MODEL=llama-3.1-8b-instant
GROQ_TIMEOUT_SECONDS=20
GROQ_DEBUG=false
```

**Frontend** (`frontend/.env.example`):
```env
# Backend API URL
VITE_API_URL=http://localhost:8000
```

### 3.3 Restrict CORS in Production

Update `backend/api/main.py`:

```python
# Replace
allow_origins=["*"]

# With
allow_origins=[
    "http://localhost:3000",          # Local dev
    "http://localhost:5173",          # Vite default
    "https://nyaya-ai.vercel.app",   # Production frontend
    os.getenv("FRONTEND_URL", ""),    # Configurable
]
```

### 3.4 Make Ledger Paths Configurable

Update `enforcement_provenance/ledger.py` and `provenance_chain/hash_chain_ledger.py` to use environment variables for file paths:

```python
ledger_path = os.getenv("ENFORCEMENT_LEDGER_PATH", "enforcement_ledger.json")
```

---

## Phase 4: Integration Testing

**Goal**: Verify all endpoints work end-to-end.

### 4.1 Backend Smoke Tests

```bash
# Start backend
cd backend
python -m uvicorn api.main:app --host 0.0.0.0 --port 8000

# Test health
curl http://localhost:8000/health

# Test primary query
curl -X POST http://localhost:8000/nyaya/query \
  -H "Content-Type: application/json" \
  -d '{"query": "What is the punishment for theft in India?", "jurisdiction_hint": "India"}'

# Test new endpoints (use trace_id from query response)
curl http://localhost:8000/nyaya/case_summary?trace_id=<TRACE_ID>
curl http://localhost:8000/nyaya/legal_routes?trace_id=<TRACE_ID>
curl http://localhost:8000/nyaya/timeline?trace_id=<TRACE_ID>
curl http://localhost:8000/nyaya/glossary?trace_id=<TRACE_ID>
curl http://localhost:8000/nyaya/jurisdiction_info?jurisdiction=IN
curl http://localhost:8000/nyaya/enforcement_status?trace_id=<TRACE_ID>

# Test RL signal
curl -X POST http://localhost:8000/nyaya/rl_signal \
  -H "Content-Type: application/json" \
  -d '{"trace_id": "<TRACE_ID>", "signal_type": "feedback", "user_feedback": "positive"}'
```

### 4.2 Frontend Integration Tests

```bash
# Start frontend
cd frontend
npm run dev

# Verify in browser:
# 1. Open http://localhost:5173
# 2. Submit a legal query → should get response
# 3. Check enforcement status display
# 4. Click feedback buttons → should send RL signal
# 5. Navigate to Decision Document → generate decision
# 6. Check glossary, timeline, legal routes display
```

### 4.3 Run Existing Test Suite

```bash
# Backend unit tests
cd backend
python -m pytest tests/ -v

# Frontend E2E tests
cd frontend
npx playwright test e2e/gravitas.spec.ts
```

---

## Phase 5: Deployment

### 5.1 Backend → Render

| Config | Value |
|--------|-------|
| **Service** | Web Service |
| **Runtime** | Python 3.11 |
| **Build** | `pip install -r requirements.txt` |
| **Start** | `python -m uvicorn api.main:app --host 0.0.0.0 --port $PORT` |
| **Plan** | Starter ($7/mo) — minimum 1GB RAM for torch + sentence-transformers |
| **Env Vars** | `GROQ_API_KEY`, `HMAC_SECRET_KEY`, `FRONTEND_URL`, `GROQ_ENABLED=true` |

**Critical**: The free Render tier (512MB) **will not work** due to torch + sentence-transformers + faiss-cpu memory requirements. You need at least the **Starter plan** (1GB+).

### 5.2 Frontend → Vercel

| Config | Value |
|--------|-------|
| **Framework** | Vite |
| **Build** | `npm run build` |
| **Output** | `dist` |
| **Env Vars** | `VITE_API_URL=https://nyaya-ai-0f02.onrender.com` |

### 5.3 Post-Deploy Verification

```
1. Visit frontend URL → Should load Galaxy background + auth page
2. Submit a query → Should route to Render backend → get response
3. Check enforcement badge → Should show ALLOW/BLOCK/ESCALATE
4. Click feedback → Should send RL signal successfully
5. Test offline → Kill backend → Should show OfflineBanner
6. Restart backend → Should auto-recover and sync
```

---

## Execution Order

```
Phase 1 ──→ Phase 2 ──→ Phase 3 ──→ Phase 4 ──→ Phase 5
 Backend     Frontend     Security    Testing     Deploy
 Endpoints   Cleanup      Hardening   Smoke tests Go live
 (1 day)     (0.5 day)    (0.5 day)   (0.5 day)   (0.5 day)
```

**Estimated total: 3 days**

---

## Risk Matrix

| Risk | Impact | Mitigation |
|------|--------|------------|
| Render free tier OOM | 🔴 High | Use Starter plan (1GB+) |
| Groq API key exposed | 🔴 High | Rotate immediately, use env vars only |
| BM25/FAISS index build time on cold start | 🟡 Medium | Pre-build index, persist to `data/vector_index/` |
| SCI scraper blocked | 🟢 Low | Mock data fallback already exists |
| Frontend calls missing endpoints → errors | 🔴 High | Phase 1 creates all 7 endpoints first |
| Provenance ledger file permissions on Render | 🟡 Medium | Use `/tmp` or environment-configured path |

---

## Files Modified/Created Summary

### New Files
| File | Purpose |
|------|---------|
| `backend/.env.example` | Backend env template |
| `frontend/.env.example` | Frontend env template |
| `frontend/.env` | Local dev config (gitignored) |

### Modified Files
| File | Changes |
|------|---------|
| `backend/api/router.py` | +7 new endpoints, +ResponseCache class |
| `backend/api/main.py` | CORS restriction |
| `frontend/vercel.json` | Fix env var name |
| `frontend/vite.config.js` | Fix proxy config |
| `frontend/src/lib/apiConfig.ts` | Ensure localhost fallback |

### Deleted Files
| File | Reason |
|------|--------|
| `frontend/src/services/nyayaBackendApi.js` | Duplicate API client |
| `frontend/src/App_Old_Backup.jsx` | Stale backup |
| `frontend/src/App_New.jsx` | Unused |
| `frontend/src/components/LegalQueryCard_BACKUP.jsx` | Empty backup |
| `backend/api/router_broken.py` | Broken backup |
| `backend/frontend/` | Empty folder |

---

*This plan should be reviewed before execution. Once approved, each phase should be implemented and tested sequentially.*
