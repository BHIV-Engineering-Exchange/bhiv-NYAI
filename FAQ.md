# Nyaya AI — FAQ

> 🗄️ **HISTORICAL RECORD** — Retained unmodified as a legacy FAQ (pre-TANTRA v3). Authoritative documentation: [docs/ hub](docs/README.md).

---

### Q: How do I start the backend?
```bash
cd backend
python -m uvicorn api.main:app --host 0.0.0.0 --port 8000
```
Requires Python 3.11+ with `pip install -r requirements.txt` run first.

---

### Q: How do I start the frontend?
```bash
cd frontend
npm install
npm run dev
```
Opens on `http://localhost:3000`. Proxies `/nyaya` and `/health` to backend.

---

### Q: How do I configure the backend API URL for the frontend?
Set `VITE_API_URL` in `frontend/.env`:
```
VITE_API_URL=http://localhost:8000
```
For production, set it in the Vercel dashboard.

---

### Q: What are the enforcement decisions?
| Decision | Meaning |
|----------|---------|
| `ALLOW` | Full advisory response |
| `ALLOW_INFORMATIONAL` | Factual/informational response only |
| `SAFE_REDIRECT` | Ambiguous query — redirected with disclaimer |
| `RESTRICT` | Blocked — malicious intent or safety violation |

---

### Q: How does hybrid search work?
Two retrieval methods run in parallel:
1. **BM25 (sparse)** — Token-level matching using BM25Okapi
2. **FAISS (dense)** — Semantic similarity using BAAI/bge-m3 embeddings

Scores are fused additively, then a cross-encoder reranks the top results.

---

### Q: What happens if Groq LLM is unavailable?
The system falls back to a **deterministic local response** (`local_fallback`). The `answer_source` field in the response indicates which path was used:
- `groq_llm` — LLM-generated
- `local_fallback` — Template-based
- `skipped` — No statutes found

---

### Q: What happens if the backend goes down?
The frontend has built-in resilience:
1. `useResiliency` hook detects failure
2. `OfflineBanner.jsx` shows degraded-mode UI
3. `offlineStore.js` persists case data to localStorage
4. Health polling (15s) auto-detects recovery
5. Pending data syncs automatically on reconnection

---

### Q: What are the minimum server requirements?
| Component | Requirement |
|-----------|------------|
| Backend | 1GB+ RAM (torch + sentence-transformers + FAISS) |
| Frontend | Any static hosting (Vercel free tier works) |
| Python | 3.11+ |
| Node | 18+ |

---

### Q: How do I run the test suite?
```bash
# Backend tests
cd backend
python -m pytest tests/ -v

# Frontend E2E
cd frontend
npx playwright test e2e/gravitas.spec.ts
```

---

### Q: How do I add a new jurisdiction?
1. Add statute JSON files to `backend/db/<country>/`
2. Add domain map to `backend/db/<country>_domain_map.json`
3. Add procedure data to `backend/procedures/data/<country>/`
4. Update `JurisdictionDetector` keywords in `backend/core/jurisdiction/detector.py`
5. Add jurisdiction metadata to `/nyaya/jurisdiction_info` in `router.py`

---

### Q: How do I rotate the Groq API key?
1. Go to Groq console → Revoke old key
2. Generate new key
3. Set `GROQ_API_KEY` in your deployment dashboard (Render)
4. **Never** put the key in `.env` that gets committed

---

### Q: What is the provenance ledger?
An append-only, SHA256 hash-chained log of all enforcement decisions. Each entry links to the previous via its hash, making tampering detectable. Use `verify_ledger_integrity()` to validate.

---

### Q: What is the trace_id?
A unique identifier generated for every query (`trace_20260416_140406_367909`). It connects:
- The original query
- All cached downstream data (summary, routes, timeline, etc.)
- Enforcement decisions
- RL feedback signals
- Provenance chain entries

---

### Q: How do I deploy?
**Backend → Render**: Connect GitHub repo, set build command `pip install -r requirements.txt`, start command `python -m uvicorn api.main:app --host 0.0.0.0 --port $PORT`, set env vars.

**Frontend → Vercel**: Connect GitHub repo, framework "Vite", set `VITE_API_URL` to Render backend URL.
