# NYAI — Documentation Index

> Navigational map of every file and document in the repo. File trees verified 2026-08-17. Obsolete/historical content is tracked in [Archive](ARCHIVE.md).

---

## 1. Where Everything Lives

```
NYAI/
├── README.md                      ← ⭐ AUTHORITATIVE HUB (root entry point)
├── docs/                          ← ⭐ CANONICAL DOCUMENTATION
│   ├── README.md                    Hub index
│   ├── SETUP.md                     Install & configure (local)
│   ├── API_REFERENCE.md             80-endpoint reference
│   ├── ENVIRONMENT_VARIABLES.md     Code-verified config registry
│   ├── TESTING.md                   How to run every test suite
│   ├── DEPLOYMENT.md                A–Z deployment & ops manual
│   ├── ARCHITECTURE.md              System design (modules, flows, security)
│   ├── DOCUMENTATION_INDEX.md       This file
│   ├── ARCHIVE.md                   Obsolete content + replacement map
│   └── validation/
│       └── VALIDATION_REPORT.md     Full 2026-08-14 evidence report
├── backend/                       ← Python FastAPI backend (canonical source)
├── frontend/                      ← React + Vite + TypeScript frontend
├── final_decision_contract.json   ← TANTRA v3 response contract (v2.0.0)
├── ...                            ← task/audit sprint folders (historical records)
└── bucket/, Shakti-GC-Infra/, BHIV-Core-TANTRA-Sutradhar/,
    bhiv-registry/, bhiv-SVACS/    ← ARCHIVED integration repos (git-ignored)
```

> **Single source of truth rule**: `docs/` + root `README.md` are authoritative. Duplicate/legacy `.md` files in `backend/` and `frontend/` are either archived (see [Archive](ARCHIVE.md)) or retained as historical records and should not be edited without updating the canonical docs too.

---

## 2. Backend Module Map (`backend/`)

### Entry & API Gateway (`api/`)
| File | Purpose |
|---|---|
| `main.py` | App factory, middleware stack, route registration, startup threads (bucket/insightflow outbox recovery) |
| `router.py` | `/nyaya/*` legal query routes (query, multi_jurisdiction, trace, output, tantra_flow, feedback, rl_signal, explain_reasoning, cached downstream endpoints) |
| `schemas.py` | Pydantic request/response models |
| `security.py` | `X-API-Key` + `ECOSYSTEM_READ_API_KEY` auth, fail-closed `503` |
| `dependencies.py` | DI helpers, nonce validation, trace extraction |
| `rate_limiter.py` | Sliding-window rate limiting |
| `trace_middleware.py` | `X-Trace-Id` propagation (uuid4 fallback) |
| `structured_logger.py` | JSON structured logging |
| `response_builder.py` | TANTRA v3 response assembly + `determinism_proof` |
| `error_codes.py` | Canonical error enum |
| `metrics.py` | Prometheus-style counters |
| `health.py` | `/health`, `/health/live`, `/health/ready` (dependency checks) |
| `evidence_router.py` | `/evidence/*` |
| `knowledge_router.py` | `/knowledge/*` |
| `workspace_router.py` | `/workspace/*` |
| `graph_router.py` | `/graph/*` |
| `ecosystem_router.py` | `/ecosystem/*` health + event ingestion |
| `procedure_router.py` | `/nyaya/procedures/*` |
| `debug_router.py` | `/debug/*` (only when `ENABLE_DEBUG_ROUTES=true`) |

### TANTRA Core (`tantra/`)
| File | Purpose |
|---|---|
| `flow.py` | TANTRA v3 governance pipeline (cache, advisories, recommendation) |
| `output_bucket.py` | Append-only artifact writer (local or `OUTPUT_DIRECTORY`) |
| `sovereign_core_mock.py` | Mock sovereign core for tests |

### Services (`services/`)
| File | Purpose |
|---|---|
| `query_executor.py` | Retrieval pipeline orchestration (hybrid retriever + reranker) |
| `query_cleaner.py` | Query normalization |
| `query_understanding.py` | Groq-backed intent parsing |
| `query_expander.py` | Groq-backed query expansion |
| `retriever.py` | BM25 retrieval |
| `reranker.py` | Cross-encoder rerank |
| `explainer.py` | Groq answer generation |
| `legal_reasoner.py` | Deterministic legal reasoning |
| `evidence_service.py`, `knowledge_service.py`, `ingestion_service.py`, `promotion_service.py`, `graph_service.py`, `verification_service.py`, `replay_service.py` | Domain services |

### Core subsystems (`core/`)
| Path | Purpose |
|---|---|
| `core/llm/groq_client.py` | Raw Groq client (default `llama-3.3-70b-versatile`) |
| `core/llm/groq_runtime_client.py` | Runtime chat client (default `llama-3.1-8b-instant`) |
| `core/llm/groq_retrieval.py` | Groq section rerank |
| `core/llm/profile_utils.py` | Profile/user-context helpers |
| `core/vector/*` | FAISS embeddings + semantic search (optional, `SEMANTIC_SEARCH_ENABLED`) |
| `core/ontology/*` | Indian legal ontology, offense subtypes, statute resolver |
| `core/jurisdiction/detector.py` | IN/UK/UAE/KSA detection (+ internal `README.md`) |
| `core/caselaw/*` | Case-law loader + retriever |
| `core/addons/*` | Dowry precision layer + addon subtype resolution (includes `offense_subtypes_addon_multi_jurisdiction.json`) |
| `core/scrapers/*` | SC India scraper + caselaw parser + scheduler |
| `core/response/enricher.py` | Response enrichment |

### Legal Database (`legal_database/`)
| File | Purpose |
|---|---|
| `database_loader.py` | Loads `db/*.json` section data (9,723 sections) |
| `enhanced_legal_agent.py` | Deterministic legal advisor |
| `enhanced_response_builder.py` | DB-backed response builder |
| `enhanced_procedure_endpoints.py` | 3 extra `/nyaya/procedures` endpoints (nonce-gated) |

### Governance & Observability
| Path | Purpose |
|---|---|
| `provenance_chain/event_signer.py` | HMAC-SHA256 event signatures |
| `provenance_chain/hash_chain_ledger.py` | Append-only ledger |
| `provenance_chain/nonce_manager.py` | Nonce TTL management |
| `provenance_chain/context_fingerprint.py` | Context fingerprinting |
| `provenance_chain/lineage_tracer.py` | Trace lineage |
| `provenance_chain/events_api.py` | Event API |
| `observer/pipeline.py` | Observer validation pipeline (`observer_validation` in responses) |
| `governed_execution/pipeline.py` | Governed execution pipeline |
| `rl_engine/*` | RL reward engine, learning store, performance memory, feedback API |

### Data Stores
| Path | Purpose |
|---|---|
| `evidence/*` | Evidence repository, storage backend, integrity, search, export, replay |
| `knowledge/*` + `knowledge/graph/*` | Knowledge repository, evidence bridge, graph registry/traversal (+ `graph/models.py`) |
| `ingestion/*` | Extraction pipeline, validation, audit logging |
| `promotion/*` | Draft→review→approved lifecycle, approval trail, rollback |
| `workspace/*` | Document + annotation stores, diff |
| `jurisdiction_router/*` | Confidence aggregation, fallback manager, resolver pipeline |

### Ecosystem (`ecosystem/`)
| File | Purpose |
|---|---|
| `bucket_producer.py` | Bucket artifact producer + outbox (Phase VI) |
| `bhiv_core_client.py` | BHIV Core client |
| `insightflow_publisher.py` | InsightFlow dataset registration + telemetry (handles `409`) |
| `clo_consumer.py` | CLO consumption + ontology sync |
| `samachar_client.py` | SVACS event receiver (+ `proposed_nyai_registry_entry.json`) |

### Procedures (`procedures/`)
| File | Purpose |
|---|---|
| `intelligence.py` | Procedural intelligence engine |
| `loader.py` | Procedure data loader |
| `integration.py` | Procedure integration |
| `schemas/` | 10 schema/doc files for procedure validation |
| `data/` | Jurisdiction data dirs (`india/`, `ksa/`, `uae/`, `uk/`) |

### Data & Deployment
| Path | Purpose |
|---|---|
| `db/*.json` | 70 legal dataset files (9,723 sections) |
| `data/` | Optional FAISS index + ontology data |
| `deploy/render.production.env.example` | Canonical Render env template |
| `Dockerfile`, `docker-compose.yml` | Optional container deployment |
| `runtime.txt` | Python 3.11.9 production pin |
| `requirements.txt` | Python deps |
| `.env.example` | Full local env template |
| `final_decision_contract.json` | *(root)* TANTRA v3 contract |

### Backend Tests (`backend/tests/`)
Authoritative suite (165 tests). 39 Python files (30 `test_*.py` files + 9 support files: `conftest.py`, `debug_*.py`, `run_gold_tests.py`, `verify_db_loading.py`). Key files: `test_production_hardening.py`, `test_tantra_convergence.py`, `test_evidence_infrastructure.py`, `test_knowledge_repository.py`, `test_graph_runtime.py`, `test_live_backend.py` (live, key embedded). `test_faiss_search.py` requires FAISS. `gold_cases/` contains 6 golden test JSON files. Legacy standalone scripts `backend/test_*.py` (21 scripts) are tracked in [Archive](ARCHIVE.md) §5. Additional legacy verify scripts: `verify_indian_law_dataset.py`, `verify_indian_law_complete.py`, `verify_all_files_loaded.py`, `data_bridge/test_loader.py`.

---

## 3. Frontend Module Map (`frontend/`)

| Path | Purpose |
|---|---|
| `src/App.tsx` | Root app shell |
| `src/lib/apiConfig.ts` | Reads `VITE_API_URL` / `VITE_NYAI_API_KEY`, axios setup |
| `src/lib/` | API client, trace helpers, recommendation helpers |
| `src/components/` | UI components (decision gates, renderers, overlays) |
| `src/pages/` | Page routes |
| `src/tests/` | Legacy unit helpers (see [Archive](ARCHIVE.md) §5) |
| `e2e/gravitas.spec.ts` | **Playwright E2E (10 tests, authoritative)** |
| `e2e/` + `E2E_SETUP.md` | E2E config + CI notes |
| `deploy/vercel.production.env.example` | Canonical Vercel env template |
| `vercel.json` | Vite SPA fallback rewrite |
| `vite.config.ts`, `playwright.config.ts` | Build/E2E config |

---

## 4. Task & Audit Folders (Historical Records)

These sprint/task folders are historical records — indexed, **not** rewritten:
`review_packet/` (enablement checklist), `Phase6_Roadmap/`, `Tantra_Hacks_Day3/`, `audit_*`, `integrity_*`, `dataset_audit*`, `D1/`, `D2/`, `D3/`, `run_tantra_tests/`, `api/`, `evidence_audit/`, `postmortems/`, `risk_assessment/`, `security/`, `S1_Incident_Reports/`, `governance/`.

---

## 5. Document Classification Legend

| Class | Meaning | Where |
|---|---|---|
| **Canonical** | Authoritative, maintained | `docs/` + root `README.md` |
| **Historical** | Accurate record of a past point; index but don't rewrite | task/audit folders |
| **Archived** | Superseded; kept for reference only | `docs/ARCHIVE.md` map |
| **Template** | Deployment env examples | `backend/deploy/`, `frontend/deploy/` |
