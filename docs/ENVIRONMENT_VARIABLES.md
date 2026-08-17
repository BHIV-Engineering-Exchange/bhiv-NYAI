# NYAI — Environment Variables

> **Complete, code-verified registry** (2026-08-17). Every variable below was located in the source (`os.getenv` / `os.environ.get`). The authoritative template is `backend/.env.example`; this document adds defaults and exact source locations.

---

## 1. Backend — Server & Runtime

| Variable | Default | Source | Purpose |
|---|---|---|---|
| `HOST` | `0.0.0.0` | `api/main.py:216` | Uvicorn bind host |
| `PORT` | `8000` | `api/main.py:215`, `api/router.py:913` | Uvicorn bind port (Render sets `$PORT`) |
| `PYTHON_VERSION` | `3.11.9` | `.env.example` | Render build hint (must match `runtime.txt`) |
| `ALLOWED_ORIGINS` | `(localhost 3000/5173)` | `api/main.py:58` | Comma-separated CORS origins override |
| `FRONTEND_URL` | — | `api/main.py:70` | Appended to CORS allow-list |
| `ENABLE_DEBUG_ROUTES` | `false` | `api/main.py:128` | Mounts unauthenticated `/debug/*` (dev only) |
| `LOG_LEVEL` / `LOG_FORMAT` / `LOG_FILE` | `INFO` / `json` / `nyaya.log` | `.env.example` | Structured logging config |

## 2. Authentication & Rate Limiting

| Variable | Default | Source | Purpose |
|---|---|---|---|
| `NYAI_API_KEY` | — | `api/security.py:105`, `api/router.py:915`, `tantra/flow.py:40` | Gateway API key. **Required** — protected routes return `503 AUTH_CONFIGURATION_ERROR` if unset. Missing/invalid key → `401` |
| `ECOSYSTEM_READ_API_KEY` | — | `api/security.py:34` | Read-only (GET) access to `/knowledge/*` + `/graph/*` for external collaborators |
| `RATE_LIMIT_PER_MINUTE` | `60` | `api/rate_limiter.py:30` | Sliding-window requests per client token |
| `RATE_LIMIT_BURST` | `10` | `api/rate_limiter.py:38` | Burst allowance |

## 3. LLM (Groq)

| Variable | Default | Source | Purpose |
|---|---|---|---|
| `GROQ_ENABLED` | `true` | `core/llm/groq_client.py:28`, `groq_retrieval.py:147`, `services/explainer.py:35` | Master LLM toggle |
| `GROQ_API_KEY` | — | `groq_client.py:24`, `groq_retrieval.py:143`, `groq_runtime_client.py:83/90`, `explainer.py:31`, `query_expander.py:22`, `query_understanding.py:29` | Groq credentials |
| `GROQ_MODEL` | `llama-3.1-8b-instant` | `groq_runtime_client.py:20` (`DEFAULT_GROQ_MODEL`); `groq_client.py:25` defaults `llama-3.3-70b-versatile` | Chat model |
| `GROQ_BASE_URL` | `https://api.groq.com/openai/v1` | `groq_client.py:26`, `groq_runtime_client.py:93`, `explainer.py:33` | Groq API base |
| `GROQ_TIMEOUT_SECONDS` | `20` | `groq_client.py:27`, `groq_runtime_client.py:94`, `explainer.py:34` | Request timeout |
| `GROQ_DEBUG` | `false` | `groq_client.py:29`, `groq_runtime_client.py:95` | Verbose LLM logging |
| `GROQ_QUERY_UNDERSTANDING_MODEL` | `llama-3.1-8b-instant` | `services/query_understanding.py:33` | Understanding sub-model |
| `GROQ_QUERY_EXPANDER_MODEL` | `llama-3.1-8b-instant` | `services/query_expander.py:26` | Expansion sub-model |
| `GROQ_EXPLAINER_MODEL` | `llama-3.1-8b-instant` | `services/explainer.py:32` | Answer generation sub-model |
| `GROQ_SECTION_RERANK_ENABLED` | `true` | `.env.example` | Groq section rerank toggle (consumed via `GROQ_SECTION_RERANK_CANDIDATES`) |
| `GROQ_SECTION_RERANK_CANDIDATES` | `18` | `core/llm/groq_retrieval.py:154` | Candidate count for Groq rerank |
| `GROQ_QUERY_UNDERSTANDING_ENABLED` | `true` | `core/llm/groq_retrieval.py:148` | Query understanding sub-step toggle |

## 4. Retrieval Pipeline

| Variable | Default | Source | Purpose |
|---|---|---|---|
| `HYBRID_RETRIEVER_ENABLED` | `true` | `services/query_executor.py:13` | Enables BM25 + FAISS hybrid retriever |
| `HYBRID_RETRIEVER_TIMEOUT_SECONDS` | `12` | `services/query_executor.py:12` | Retriever timeout |
| `RERANKER_ENABLED` | `true` | `services/query_executor.py:29` | Cross-encoder rerank toggle |
| `RERANKER_TIMEOUT_SECONDS` | `8` | `services/query_executor.py:28` | Rerank timeout |
| `SEMANTIC_SEARCH_ENABLED` | `false` | `clean_legal_advisor.py:593` | FAISS semantic search toggle |
| `DETERMINISM_GUARD_ENABLED` | `false` | `api/router.py:50` | Determinism guard on responses |

## 5. Provenance / Signing

| Variable | Default | Source | Purpose |
|---|---|---|---|
| `HMAC_SECRET_KEY` | — | `provenance_chain/event_signer.py:18,26` | Key for HMAC-SHA256 event signatures |
| `SIGNING_METHOD` | `HMAC_SHA256` | `provenance_chain/event_signer.py:14` | Signature algorithm |
| `SIGNING_KEY_ID` | `primary-key-2025` | `provenance_chain/event_signer.py:15` | Key identifier in signature metadata |
| `PROVENANCE_LEDGER_PATH` | `provenance_ledger.json` | `provenance_chain/hash_chain_ledger.py:120`, `api/health.py:47` | Hash-chain ledger file (Render: `/var/data/provenance_ledger.json`) |
| `ENFORCEMENT_LEDGER_PATH` | `enforcement_ledger.json` | `.env.example` | Legacy ledger path (retained) |
| `NONCE_TTL_SECONDS` | `300` | `provenance_chain/nonce_manager.py:9` | Nonce validity window |

## 6. Data Directories & Storage

| Variable | Default | Source | Purpose |
|---|---|---|---|
| `INPUT_DIRECTORY` | `db` | `.env.example` | Ingestion input dir |
| `OUTPUT_DIRECTORY` | `output` | `tantra/output_bucket.py:180`, `ecosystem/bucket_producer.py:49`, `ecosystem/insightflow_publisher.py:52`, `provenance_chain/hash_chain_ledger.py:123` | Output bucket JSONL dir (Render: `/var/data`) |
| `KNOWLEDGE_STORE_DIRECTORY` | *(empty → local default)* | `knowledge/storage_backend.py:41`, `knowledge/graph/registry.py:22` | Knowledge repository store |
| `WORKSPACE_STORE_DIRECTORY` | *(empty → local default)* | `workspace/annotation_store.py:47`, `workspace/document_store.py:51` | Workspace documents/annotations |
| `INGESTION_LOG_DIRECTORY` | *(empty → local default)* | `ingestion/logger.py:44` | Ingestion audit log |
| `PROMOTION_LOG_DIRECTORY` | *(empty → local default)* | `promotion/approval.py:58` | Promotion audit log |
| `DATABASE_URL` | `sqlite:///./nyaya.db` | `.env.example` | Legacy optional SQLite URL |

## 7. Ecosystem Integrations (Phase VI — all default `false`)

| Variable | Default | Source | Purpose |
|---|---|---|---|
| `BUCKET_ENDPOINT` | `https://bhiv-bucket-i1l6.onrender.com` | `.env.example` | Bucket target |
| `BUCKET_PRODUCER_ENABLED` | `false` | `ecosystem/bucket_producer.py:36` | Append-only artifact write + outbox |
| `BHIV_CORE_ENDPOINT` | `http://localhost:8003` | `.env.example` | Core target |
| `BHIV_CORE_ENABLED` | `false` | `ecosystem/bhiv_core_client.py:57` | Core registry participation |
| `INSIGHTFLOW_ENDPOINT` | `https://bhiv-mdu-api.onrender.com` | `.env.example` | InsightFlow target |
| `INSIGHTFLOW_API_KEY` | — | `ecosystem/insightflow_publisher.py:48` | InsightFlow credentials |
| `INSIGHTFLOW_ENABLED` | `false` | `ecosystem/insightflow_publisher.py:38` | Dataset registration + telemetry |
| `CLO_ENDPOINT` | `https://shakti-gc-infra.onrender.com` | `.env.example` | CLO target |
| `CLO_ENABLED` | `false` | `ecosystem/clo_consumer.py:15` | CLO consumption |
| `CLO_SYNC_ENABLED` | `false` | `ecosystem/clo_consumer.py:19` | Ontology sync toggle |
| `SAMACHAR_ENDPOINT` | `http://localhost:8000` | `ecosystem/samachar_client.py:21` | SVACS signal receiver |
| `SAMACHAR_ENABLED` | `false` | `ecosystem/samachar_client.py:15` | Webhook receiver |
| `SVACS_ENABLED` | `false` | `ecosystem/samachar_client.py:16` | SVACS event ingestion |
| `SVACS_ENDPOINT` | *(empty)* | `ecosystem/samachar_client.py:21` | Fallback alias for `SAMACHAR_ENDPOINT` |

## 8. Test / Tooling Only

| Variable | Default | Source | Purpose |
|---|---|---|---|
| `SMOKE_BASE_URL` | `http://127.0.0.1:8000` | `_local_smoke_test.py:12` | Smoke-test target |
| `RENDER_BASE_URL` | — | `smoke_test_all.py:196` | Full smoke-suite target |

---

## 9. Platform-Only / Unused by Application Code

These variables appear in `backend/.env.example` but are **not consumed** by any Python source via `os.getenv` / `os.environ.get`. They are retained for platform configuration (Render hints) or legacy compatibility.

| Variable | Where Listed | Notes |
|---|---|---|
| `PYTHON_VERSION` | `.env.example` | Render build hint only — not read by application code |
| `LOG_LEVEL` | `.env.example` | Listed but not read; standard `logging` is used without env config |
| `LOG_FORMAT` | `.env.example` | Listed but not read |
| `LOG_FILE` | `.env.example` | Listed but not read |
| `ENFORCEMENT_LEDGER_PATH` | `.env.example` | Legacy; no code reads this (replaced by `PROVENANCE_LEDGER_PATH`) |
| `INPUT_DIRECTORY` | `.env.example` | Listed but not read; `db/` is hardcoded as the data source |
| `DATABASE_URL` | `.env.example` | Legacy SQLite URL; not consumed by any module |

---

## 10. Frontend Variables (`frontend/.env*`)

| Variable | Purpose |
|---|---|
| `VITE_API_URL` | Backend base URL. Local: `http://localhost:3000` (Vite proxy) or `http://localhost:8000`. Production: `https://nyai-backend-n9h8.onrender.com`. Read in `src/lib/apiConfig.ts`. |
| `VITE_NYAI_API_KEY` | Gateway key sent as `X-API-Key` on `/nyaya/*`. Must match backend `NYAI_API_KEY`. |

> **Security**: `VITE_*` variables are inlined into the client bundle at build time — they are publicly visible. Treat `VITE_NYAI_API_KEY` as a public-client token, not a server secret.

---

*Cross-checked against `backend/.env.example` and all source usages. Last verified 2026-08-17.*
