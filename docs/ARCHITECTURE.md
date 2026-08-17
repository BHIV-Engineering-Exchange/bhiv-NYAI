# NYAI — System Architecture

> Verified against the live codebase (2026-08-17). Supersedes the legacy `backend/ARCHITECTURE.md` (see [Archive](ARCHIVE.md)).

---

## 1. High-Level Overview

NYAI (Nyaya AI) is a sovereign-compliant multi-agent legal intelligence platform. A React/Vite frontend talks to a FastAPI gateway that routes legal queries through a deterministic pipeline: query understanding → hybrid retrieval (BM25 + optional FAISS) → legal reasoning → case-law retrieval → answer generation (Groq LLM or deterministic fallback) → advisory recommendation. Every request produces a signed, hash-chained provenance trail and an observer-validated TANTRA v3 response.

```
┌──────────────┐   X-Trace-Id + X-API-Key   ┌──────────────────────────────────────┐
│  Frontend    │───────────────────────────▶│         Backend (FastAPI)             │
│  React/Vite  │◀───────────────────────────│                                     │
│  port 3000   │   TANTRA v3 response       │  api/main.py                         │
└──────┬───────┘                            │  │  Middleware chain                 │
       │                                    │  │  CORS → TraceId → StructuredLog   │
       │                                    │  │  → RateLimiter → APIKeyAuth       │
       │                                    │  │  │                               │
       │                                    │  │  ▼                               │
       │                                    │  ┌────────┐    ┌───────────────────┐ │
       │                                    │  │routers │───▶│ /nyaya, /evidence │ │
       │                                    │  └────────┘    │ /knowledge, ...   │ │
       │                                    │                └───────────────────┘ │
       │                                    │                       │              │
       │                                    │  ┌────────────────────▼───────────┐  │
       │                                    │  │ Query pipeline (see §4)       │  │
       │                                    │  │ → Observer (TANTRA v3)        │  │
       │                                    │  │ → OutputBucket (JSONL)        │  │
       │                                    │  └───────────────────────────────┘  │
       │                                    │  Provenance chain · Evidence · RL  │
       └──────────  Vercel / localhost  ────┴──────────────────────────────────────┘
```

---

## 2. Backend Modules (`backend/`)

| Package / File | Responsibility |
|---|---|
| `api/` | FastAPI app, middleware, routers, schemas, response builder, error codes, metrics, structured logging |
| `api/main.py` | App assembly, middleware order, router mounting, startup recovery threads, root `/` info |
| `api/router.py` | `/nyaya/*` endpoints, query pipeline orchestration, response cache |
| `core/` | Domain logic: `vector` (FAISS), `ontology` (statute resolver), `response`, `llm` (Groq clients, retrieval augmentor), `jurisdiction` (detector), `caselaw`, `addons`, `scrapers` |
| `services/` | Query cleaner, understanding, expander, hybrid retriever (BM25+FAISS), reranker, legal reasoner, explainer (Groq answer w/ fallback), query executor |
| `clean_legal_advisor.py` | Core advisory engine — statute matching, confidence, procedural steps, remedies |
| `tantra/` | Governance flow (`flow.py`), output bucket (JSONL append-only store) |
| `observer/` | TANTRA v3 response validation pipeline (schema, fail-closed) |
| `governed_execution/` | Execution gate / pipeline control |
| `provenance_chain/` | Event signer (HMAC-SHA256), hash chain ledger, lineage tracer, nonce manager |
| `evidence/` | `EvidencePackage` model, `EvidenceRepository` (L2 persistent storage) |
| `knowledge/` | Knowledge repository, storage backend, integrity, graph runtime, evidence bridge |
| `ingestion/` | Ingestion pipeline (extractor, validator, logger) |
| `promotion/` | Promotion lifecycle (draft → review → approved → archived), rollback |
| `workspace/` | Document store, annotations, diff/compare |
| `rl_engine/` | Feedback processing, performance memory, reward engine |
| `ecosystem/` | External integrations: bucket producer, BHIV Core client, InsightFlow publisher, CLO consumer, SAMACHAR/SVACS client |
| `procedures/` | Jurisdiction procedure intelligence (4 jurisdictions × 4 domains) |
| `jurisdiction_router/` | Resolver pipeline, confidence aggregator, fallback manager |
| `sovereign_agents/` | Base/legal agent abstractions |
| `data_bridge/` | JSON dataset loader & validator (+ `schemas/` subdir, colocated `test_loader.py`) |
| `legal_database/` | Enhanced procedure endpoints + full-section retrieval |
| `db/` | 70 JSON statute datasets (BNS, IPC, CrPC, UK, UAE, …) — 9,723 sections |

---

## 3. Frontend Modules (`frontend/src/`)

| Area | Files | Responsibility |
|---|---|---|
| Entry | `App.jsx`, `main` | State-based view routing, auth gate, global resilience wiring |
| Services | `services/nyayaApi.js`, `nyayaBackendApi.js`, `apiService.js` | Axios/fetch clients, `X-API-Key` + `X-Trace-ID` injection, outage detection |
| Lib | `lib/apiConfig.ts`, `GravitasResponseTransformer.js`, `casePayloadValidator.js`, `gravitas.types.js` | Config, response normalization, formatter contract validation |
| Hooks | `useResiliency.js`, `useGravitasDecision.js`, `useServiceOutage.js` | Degraded-mode, offline store, decision flows |
| Components | `components/` (48 files) | Pages (LegalQueryCard, DecisionPage, LegalOSDashboard, …), cards, Gravitas panel, infra UI (ErrorBoundary, OfflineBanner, Galaxy) |
| Offline | `services/offlineStore.js` | localStorage persistence + replay sync |
| E2E | `e2e/gravitas.spec.ts` | 10 Playwright tests |

---

## 4. Request Lifecycle — `POST /nyaya/query`

Verified against `api/router.py` + pipeline services:

```
1. Client → POST /nyaya/query  (X-API-Key, X-Trace-Id)
2. Middleware: CORS → TraceId (inject/generate uuid4) → StructuredLogging →
   RateLimiter (60/min sliding window, burst 10) → APIKeyAuth (401 if missing/invalid,
   503 if NYAI_API_KEY unset)
3. api/router.py query_legal()
   ├─ QueryRequest validated (pydantic; 422 on schema violation)
   ├─ Query cleaner        (services/query_cleaner.py)
   ├─ Query understanding  (services/query_understanding.py; Groq or local heuristics)
   ├─ Query expansion      (services/query_expander.py)
   ├─ Hybrid retrieval     (services/retriever.py: BM25 sparse + optional FAISS dense)
   ├─ Reranker             (services/reranker.py; cross-encoder / Groq section rerank)
   ├─ Legal reasoner       (services/legal_reasoner.py; domain rules)
   ├─ clean_legal_advisor  (statute matching, confidence, procedural steps, remedies)
   ├─ Case-law retrieval   (core/caselaw/retriever.py)
   ├─ Response enricher    (core/response/enricher.py: timeline, glossary, evidence)
   ├─ Explain/answer       (services/explainer.py: Groq chat completions; validates
   │                        statute grounding + jurisdiction; local_fallback on failure)
   ├─ Response builder     (api/response_builder.py → TANTRA v3, 11 required fields)
   ├─ Observer validation  (observer/pipeline.py → validation_status=PASS/FAIL)
   ├─ OutputBucket append  (tantra/output_bucket.py → JSONL, evidence record)
   └─ ResponseCache.set(trace_id, response)
4. Response returned; X-Trace-Id echoed; downstream GET endpoints
   (/nyaya/case_summary, /timeline, /glossary, …) read from ResponseCache.
```

**Recommendation semantics**: `recommendation.type ∈ {INFORM, REVIEW, ESCALATE, INSUFFICIENT_DATA}` — **advisory only**. There is no `enforcement_decision` gate; the legacy enforcement engine was removed (see [Archive](ARCHIVE.md)).

---

## 5. Provenance, Evidence & Governance

- **Provenance chain**: every event signed with `HMAC_SHA256` (`SIGNING_METHOD`) using `HMAC_SECRET_KEY`/`SIGNING_KEY_ID`; events appended to a hash-linked ledger (`PROVENANCE_LEDGER_PATH`, default `provenance_ledger.json`). Nonce manager prevents replay (`NONCE_TTL_SECONDS`).
- **Output bucket**: append-only JSONL (`OUTPUT_DIRECTORY`, default `output/`) keyed by `trace_id`; each entry hash-verifiable.
- **Evidence layer**: `OutputBucket` → `EvidencePackage` → `EvidenceRepository` (L2). `/evidence/*` API reads/search/verifies/replays/compares/export.
- **Observer**: validates every response against the TANTRA v3 contract; `observer_validation.schema_valid` + `validation_status`.

---

## 6. Ecosystem Integrations (Phase VI)

All gated by env flags (default **false**) — see [Environment Variables](ENVIRONMENT_VARIABLES.md):

| Integration | Client | Flag | Purpose |
|---|---|---|---|
| BHIV Bucket | `ecosystem/bucket_producer.py` | `BUCKET_PRODUCER_ENABLED` | Append-only artifact write + outbox recovery |
| BHIV Core | `ecosystem/bhiv_core_client.py` | `BHIV_CORE_ENABLED` | Registry participation (read-only) |
| InsightFlow | `ecosystem/insightflow_publisher.py` | `INSIGHTFLOW_ENABLED` | Dataset registration + provenance telemetry |
| CLO (SHAKTI) | `ecosystem/clo_consumer.py` | `CLO_ENABLED` / `CLO_SYNC_ENABLED` | Ontology ingestion sync |
| SAMACHAR / SVACS | `ecosystem/samachar_client.py` | `SAMACHAR_ENABLED` / `SVACS_ENABLED` | Change-signal webhook receiver |

On startup, `api/main.py` spawns background threads to recover the Bucket and InsightFlow outboxes.

---

## 7. Security Model

- **Auth**: `X-API-Key` required on `/nyaya/*`, `/evidence/*`, `/knowledge/*`, `/workspace/*`, `/graph/*`. Fail-closed: if `NYAI_API_KEY` is unset, protected routes return `503 AUTH_CONFIGURATION_ERROR`.
- **Ecosystem read key**: `ECOSYSTEM_READ_API_KEY` grants read (GET) access to `/knowledge/*` and `/graph/*` for external collaborators.
- **CORS**: default localhost origins + `FRONTEND_URL`/`ALLOWED_ORIGINS`; regex for localhost.
- **Rate limiting**: per-token sliding window, `RATE_LIMIT_PER_MINUTE` (60) + `RATE_LIMIT_BURST` (10).
- **Debug routes**: `/debug/*` mounted only when `ENABLE_DEBUG_ROUTES=true`.
- **Error contract**: all errors → `{error_code, message, trace_id}`. Global exception handler returns `500 TANTRA FAIL CLOSED: <error>`.
