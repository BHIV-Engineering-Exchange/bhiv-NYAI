# 📋 Nyaya AI — Full Disclosure & Integration Report

> 🗄️ **HISTORICAL RECORD** — Dated 2026-04-16. One-time governance disclosure kept for reference; superseded by the [docs/ hub](docs/README.md).

> **Date**: April 16, 2026  
> **Scope**: `NYAI-Integrated/backend` + `NYAI-Integrated/frontend`  
> **Purpose**: Deep analysis of both folders → Integration plan → Deployment strategy

---

## 1. Project Overview

**Nyaya AI** is a **Consultation-Grade Legal Intelligence Platform** that provides AI-powered legal advice across **4 jurisdictions** (India, UK, UAE, KSA) and **5+ legal domains** (Criminal, Civil, Family, Commercial, Constitutional). It features sovereign enforcement, case law retrieval, NLP-powered query understanding, BM25 + FAISS hybrid search, Groq LLM answer generation, and a premium glassmorphic frontend.

---

## 2. Backend Analysis (`backend/`)

### 2.1 Tech Stack

| Layer | Technology | Version/Details |
|-------|-----------|---------|
| Framework | **FastAPI** | ≥ 0.104.0 |
| Server | **Uvicorn** | ≥ 0.24.0 |
| Language | **Python** | 3.11.8 (`runtime.txt`) |
| Validation | **Pydantic** | ≥ 2.0.0 |
| ML/NLP | **sentence-transformers** (BAAI/bge-m3), **transformers**, **torch** | 2.1.2 |
| Sparse Retrieval | **BM25** — custom `BM25Ranker` + **rank-bm25** (`BM25Okapi`) | k1=1.5, b=0.75 |
| Dense Retrieval | **FAISS** (faiss-cpu) + **NumPy** + **scikit-learn** | Inner Product index |
| LLM Integration | **Groq API** — 2 clients (response generator + explainer) | llama-3.3-70b-versatile / llama-3.1-8b-instant |
| Cross-Encoder | **sentence-transformers** CrossEncoder for reranking | 8s timeout |
| HTTP Client | **httpx** | Async support |
| Container | **Docker** (python:3.10-slim) + **docker-compose** | Port 8000 |
| Case Law Scraping | **requests** + **BeautifulSoup** | Supreme Court of India |

### 2.2 Architecture — Complete Module Map

```
backend/
├── api/                          # ─── API Layer ───
│   ├── main.py                   # FastAPI app entry, CORS, middleware, router includes
│   ├── router.py                 # Main /nyaya/* router (500 lines — core query pipeline)
│   ├── schemas.py                # Pydantic request/response models (NyayaQuery, NyayaResponse)
│   ├── procedure_router.py       # /nyaya/procedures/* endpoints (7 endpoints)
│   └── debug_router.py           # /nyaya/debug/* endpoints (dev only)
│
├── services/                     # ─── Service Layer ───
│   ├── retriever.py              # HybridLegalRetriever (BM25Okapi + FAISS + bge-m3)
│   ├── query_cleaner.py          # Query normalization + cleaning
│   ├── query_understanding.py    # NLP query understanding + intent detection
│   ├── query_expander.py         # Multi-query expansion for better recall
│   ├── reranker.py               # Cross-encoder reranking (8s timeout)
│   ├── legal_reasoner.py         # Rule-based legal reasoning engine
│   └── explainer.py              # Groq-backed explanation generator (llama-3.1-8b)
│
├── bm25_search.py                # ─── Custom BM25 ───
│   ├── BM25Ranker                # Pure Python BM25 (k1=1.5, b=0.75)
│   └── LegalBM25Search           # Legal section search with jurisdiction filter + act boosting
│
├── clean_legal_advisor.py        # ─── Core Engine (135KB) ───
│                                 # EnhancedLegalAdvisor — main orchestrator
│
├── core/                         # ─── Core Modules ───
│   ├── jurisdiction/
│   │   └── detector.py           # JurisdictionDetector (IN/UK/UAE keyword heuristics, 70+ keywords)
│   ├── caselaw/
│   │   ├── loader.py             # Case law JSON loader (indian_criminal_cases, indian_family_cases)
│   │   └── retriever.py          # Case law semantic retriever
│   ├── response/
│   │   └── enricher.py           # Response enricher (timeline, glossary, evidence, enforcement)
│   ├── ontology/
│   │   └── indian_ontology.py    # Legal ontology with offense subtypes + statute resolution
│   ├── vector/
│   │   └── faiss_index.py        # FAISS index builder + query
│   ├── llm/
│   │   └── groq_client.py        # GroqResponseGenerator (llama-3.3-70b, with local fallback)
│   ├── addons/
│   │   ├── addon_subtype_resolver.py        # Offense subtype detection (42+ subtypes)
│   │   ├── dowry_precision_layer.py         # Dowry-specific statute filtering + prioritization
│   │   ├── offense_subtypes_addon.json      # Indian offense subtypes (36KB)
│   │   └── offense_subtypes_addon_multi_jurisdiction.json  # UK/UAE offense subtypes (29KB)
│   └── scrapers/
│       ├── sc_india_scraper.py    # Supreme Court of India scraper (mock data currently)
│       ├── caselaw_parser.py      # Case law HTML parser
│       └── scheduler.py           # Scraping scheduler
│
├── enforcement_engine/           # ─── Sovereign Enforcement ───
│   ├── engine.py                 # SovereignEnforcementEngine (singleton, thread-safe)
│   ├── decision_model.py         # EnforcementDecision enum (ALLOW, ALLOW_INFORMATIONAL, SAFE_REDIRECT, RESTRICT)
│   ├── rules.py                  # 6 rule types: Intent, Constitutional, Jurisdiction, Safety, Confidence, Procedure
│   └── signer.py                 # Decision signing with HMAC
│
├── enforcement_provenance/       # ─── Provenance Audit Trail ───
│   ├── ledger.py                 # EnforcementLedger (append-only, hash-chained, tamper-detection)
│   ├── signer.py                 # Event signing
│   └── verifier.py               # Chain integrity verification
│
├── provenance_chain/             # ─── Hash Chain Ledger ───
│   ├── hash_chain_ledger.py      # HashChainLedger (SHA256 chain, genesis block)
│   └── schemas/
│       ├── event_schema.json     # Event JSON schema
│       └── signed_event_schema.json
│
├── governed_execution/           # ─── Governed Pipeline ───
│   └── pipeline.py               # GovernedExecutionPipeline (enforcement + RL gating + fallback)
│
├── rl_engine/                    # ─── Reinforcement Learning ───
│   ├── reward_engine.py          # RewardEngine (bounded reward, anomaly detection, volatility cap)
│   ├── feedback_api.py           # Feedback ingestion API
│   └── confidence_tracker.py     # Confidence tracking with EMA smoothing
│
├── sovereign_agents/             # ─── Multi-Agent System ───
│   ├── base_agent.py             # BaseAgent ABC (async process, event emission, confidence)
│   ├── legal_agent.py            # LegalAgent (per-jurisdiction instances)
│   └── constitutional_agent.py   # ConstitutionalAgent (constitutional matters)
│
├── jurisdiction_router/          # ─── Jurisdiction Routing ───
│   ├── router.py                 # JurisdictionRouter (regex patterns, IN/UK/UAE)
│   ├── confidence_aggregator.py  # ConfidenceAggregator (weighted scoring: 0.4 agent + 0.3 history + 0.2 consistency + 0.1 completeness)
│   ├── fallback_manager.py       # FallbackManager (auto-escalation, max 2 fallback attempts, 0.7 threshold)
│   └── resolver_pipeline.py      # ResolverPipeline (agent dispatch, event logging)
│
├── raj_adapter/                  # ─── Raj's Schema Integration ───
│   ├── schema_consumer.py        # RajSchemaConsumer (failure paths, evidence readiness, compliance)
│   └── enforcement_integration.py # 3 Raj rules: FailurePath, EvidenceReadiness, Compliance
│
├── raj_schemas/                  # ─── Raj's Procedural Intelligence Data ───
│   ├── evidence_readiness_v2.json
│   ├── failure_paths_v2.json
│   └── system_compliance_v2.json
│
├── procedures/                   # ─── Legal Procedure Intelligence ───
│   ├── loader.py                 # Procedure data loader
│   ├── schemas/                  # 10 schema files (appeal, evidence, failure, compliance, taxonomy)
│   └── data/                     # 4 jurisdictions × 4 domains = 16 procedure JSON files
│       ├── india/                # criminal, civil, family, consumer_commercial
│       ├── uk/                   # criminal, civil, family, consumer_commercial
│       ├── uae/                  # criminal, civil, family, consumer_commercial
│       └── ksa/                  # criminal, civil, family, consumer_commercial
│
├── events/                       # ─── Event System ───
│   ├── event_types.py            # EventType enum (AGENT_CLASSIFIED, etc.)
│   └── event_schema.json         # Event JSON schema
│
├── data_bridge/                  # ─── Data Loading ───
│   ├── loader.py                 # JSONLoader (sections, acts, cases normalization)
│   └── models.py                 # Section, Act, CaseLaw dataclasses
│
├── data/                         # ─── Prebuilt Data ───
│   ├── statutes.json             # Consolidated statute dataset for retriever
│   ├── vector_index/
│   │   ├── statutes.index        # Pre-built FAISS index (3.4MB)
│   │   └── statutes_metadata.pkl # Metadata pickle (204KB)
│   ├── caselaw/
│   │   ├── indian_criminal_cases.json
│   │   └── indian_family_cases.json
│   └── caselaw_scraped/          # 3 sample scraped cases
│
├── db/                           # ─── Legal Database (52 files) ───
│   ├── india/                    # IPC, BNS, CPC, CrPC, Evidence Act, POCSO, UAPA, IT Act, etc.
│   ├── uk/                       # Criminal Offences, Civil Procedure, Human Rights Act, etc.
│   ├── uae/                      # Federal Penal Code, Civil Transactions, Labour Law, etc.
│   ├── indian_domain_map.json    # Domain classification map
│   ├── uae_domain_map.json
│   ├── uk_domain_map.json
│   └── *_law_dataset.json        # Master datasets (3 × ~50KB)
│
├── tests/                        # ─── Test Suite ───
│   └── test_*.py                 # ~30 test files covering all domains
│
├── .env                          # Environment configuration (CONTAINS EXPOSED SECRETS)
├── requirements.txt              # Python dependencies
├── Dockerfile                    # Docker build (python:3.10-slim)
├── docker-compose.yml            # Docker compose config
└── runtime.txt                   # Python 3.11.8
```

### 2.3 API Endpoints (18 total)

| Method | Endpoint | Purpose |
|--------|----------|---------|
| `GET` | `/` | Root — API information |
| `GET` | `/health` | Health check |
| `POST` | `/nyaya/query` | **Primary** — Single jurisdiction legal query |
| `POST` | `/nyaya/multi_jurisdiction` | Multi-jurisdiction comparative query |
| `POST` | `/nyaya/explain_reasoning` | Explain reasoning for a trace |
| `POST` | `/nyaya/feedback` | Submit user feedback (RL) |
| `GET` | `/nyaya/trace/{trace_id}` | Get trace details |
| `POST` | `/nyaya/procedures/analyze` | Procedure analysis |
| `GET` | `/nyaya/procedures/summary/{country}/{domain}` | Procedure summary |
| `POST` | `/nyaya/procedures/evidence/assess` | Evidence assessment |
| `POST` | `/nyaya/procedures/failure/analyze` | Failure analysis |
| `POST` | `/nyaya/procedures/compare` | Cross-country procedure comparison |
| `GET` | `/nyaya/procedures/list` | List all procedures |
| `GET` | `/nyaya/procedures/schemas` | Get procedure schemas |
| `GET` | `/nyaya/procedures/enhanced_analysis/{jurisdiction}/{domain}` | Enhanced analysis |
| `GET` | `/nyaya/procedures/domain_classification/{jurisdiction}` | Domain classification |
| `GET` | `/nyaya/procedures/legal_sections/{jurisdiction}/{domain}` | Legal sections |
| `GET` | `/docs` | Swagger UI documentation |

### 2.4 Data Assets

| Category | Count | Size | Details |
|----------|-------|------|---------|
| Legal DB files | 52 | ~2MB | IPC, BNS, CPC, CrPC, POCSO, UAPA, IT Act + UK/UAE equivalents |
| Procedure data | 16 | ~85KB | 4 jurisdictions × 4 domains (criminal, civil, family, consumer) |
| Procedure schemas | 10 | ~18KB | Appeal, evidence, failure, compliance, taxonomy schemas |
| Case law JSON | 2 | ~9KB | Indian criminal + family cases |
| Scraped case law | 3 | ~1KB | Sample Supreme Court cases |
| Offense subtypes | 2 | ~65KB | Indian (36KB) + multi-jurisdiction (29KB) addon ontology |
| Raj schemas | 3 | ~3KB | Evidence readiness, failure paths, compliance rules |
| FAISS index | 2 | ~3.6MB | Pre-built vector index + metadata pickle |
| Domain maps | 3 | — | Indian, UK, UAE domain classification |
| Master datasets | 3 | ~152KB | Consolidated per-jurisdiction datasets |
| **Total** | **~94 data files** | **~6MB** | |

### 2.5 Hybrid Retrieval Architecture (BM25 + FAISS)

The backend uses a **two-layer retrieval system** combining sparse and dense search:

```
User Query
    ↓
Query Cleaning (remove noise, normalize)
    ↓
Query Expansion (generate multiple search queries)
    ↓
┌─────────────────────────────────────────┐
│       HYBRID SEARCH (parallel)          │
│                                         │
│  BM25 Sparse Search     FAISS Dense     │
│  (rank-bm25/BM25Okapi)  (BAAI/bge-m3)  │
│  Tokenize → IDF scores  Encode → IP     │
│         ↓                    ↓          │
│       Score Fusion (additive)           │
│       Sort by combined score            │
└─────────────────────────────────────────┘
    ↓
Cross-Encoder Reranking (8s timeout)
    ↓
Legal Reasoning Rules
    ↓
Addon Subtype Enhancement (if low confidence)
    ↓
Dowry Precision Layer (if dowry query)
    ↓
Response Enrichment (timeline, glossary, evidence)
    ↓
Groq LLM Answer Generation (20s timeout, local fallback)
    ↓
Final NyayaResponse
```

**Two BM25 Implementations:**

| File | Class | Library | Key Details |
|------|-------|---------|-------------|
| `bm25_search.py` | `BM25Ranker` + `LegalBM25Search` | Custom (pure Python) | k1=1.5, b=0.75, jurisdiction filtering, act boosting (50%), multi-field search |
| `services/retriever.py` | `HybridLegalRetriever` | `rank-bm25` (BM25Okapi) | Production hybrid, BAAI/bge-m3 embeddings, FAISS Inner Product, singleton pattern |

### 2.6 Sovereign Enforcement Engine

The enforcement engine is a **deterministic governance layer** with thread-safe singleton pattern:

**Decision Types:**
| Decision | Meaning |
|----------|---------|
| `ALLOW` | Full advisory response permitted |
| `ALLOW_INFORMATIONAL` | Informational query — factual response only |
| `SAFE_REDIRECT` | Ambiguous/low-confidence — redirect with disclaimer |
| `RESTRICT` | Blocked — malicious intent or safety violation |

**9 Enforcement Rules (6 core + 3 Raj):**
| Rule ID | Type | Source | What it checks |
|---------|------|--------|----------------|
| INTENT-001 | IntentClassificationRule | Governance | Malicious patterns (40+ blocked terms), informational vs advisory intent |
| CONST-001 | ConstitutionalComplianceRule | Constitutional | Constitutional domain requires confidence ≥ 0.8 |
| JURIS-001 | JurisdictionBoundaryRule | Governance | Country must match routed jurisdiction |
| SAFETY-001 | SystemSafetyRule | System Safety | Blocks "ignore all rules", "bypass", "circumvent" |
| CONF-001 | ConfidenceThresholdRule | System Safety | Criminal/constitutional: min 0.3, general: min 0.2 |
| PROC-001 | ProcedureIntegrityRule | Compliance | Appeals require confidence ≥ 0.75 |
| RAJ-FAILURE-001 | RajFailurePathRule | Compliance | Failure path schema validation |
| RAJ-EVIDENCE-001 | RajEvidenceReadinessRule | Compliance | Evidence readiness check (currently pass-through) |
| RAJ-COMPLIANCE-001 | RajComplianceRule | Compliance | Jurisdiction compliance validation |

### 2.7 RL Engine (Hardened)

| Parameter | Value | Purpose |
|-----------|-------|---------|
| Positive feedback reward | +0.05 | Reduced from 0.1 for stability |
| Negative feedback penalty | -0.08 | Reduced from -0.15 for stability |
| Max delta per update | ±0.03 | Absolute cap on confidence change |
| Volatility cap | 0.02 | Maximum variance allowed |
| Anomaly threshold | 5 feedbacks/hour/user | Blocks feedback flooding |
| Max confidence adjustment | ±0.15 | Overall bound |

### 2.8 Groq LLM Integration (2 Clients)

| Client | File | Model | Purpose |
|--------|------|-------|---------|
| Response Generator | `core/llm/groq_client.py` | `llama-3.3-70b-versatile` | Full legal answer from retrieved artifacts |
| Explainer | `services/explainer.py` | `llama-3.1-8b-instant` | Concise statute explanation |

Both clients have **deterministic local fallback** if Groq is unavailable or returns invalid data. The explainer also validates that responses reference provided statutes and don't hallucinate wrong jurisdictions.

### 2.9 Provenance & Audit Trail (2 Ledger Systems)

| System | File | Type | Records |
|--------|------|------|---------|
| Hash Chain Ledger | `provenance_chain/hash_chain_ledger.py` | SHA256 chain, genesis block | General events |
| Enforcement Ledger | `enforcement_provenance/ledger.py` | SHA256 chain, tamper detection | Enforcement decisions, agent execution, routing, RL updates, refusals/escalations |

Both are **append-only**, **hash-chained**, and support **integrity verification**.

### 2.10 Key Backend Capabilities Summary

1. **Query Pipeline**: Cleaning → Understanding → Expansion → **Hybrid Retrieval (BM25 + FAISS)** → Cross-Encoder Reranking → Legal Reasoning → Response Generation
2. **BM25 Search**: Custom `BM25Ranker` for standalone + `BM25Okapi` in production hybrid retriever
3. **FAISS Vector Search**: BAAI/bge-m3 embeddings with Inner Product similarity
4. **Groq LLM**: llama-3.3-70b (response) + llama-3.1-8b (explainer) with local fallback
5. **Sovereign Enforcement**: 9 deterministic rules with thread-safe singleton engine
6. **Case Law Retrieval**: Title, court, year, principle matching from JSON datasets
7. **SC India Scraper**: Supreme Court of India judgment scraper (mock data currently)
8. **Provenance Chain**: Dual hash-chain ledger for full audit trail
9. **RL Engine**: Hardened reward engine with anomaly detection, volatility cap, max delta protection
10. **Multi-Agent System**: BaseAgent → LegalAgent + ConstitutionalAgent per jurisdiction
11. **Jurisdiction Router**: Pattern matching + confidence aggregation + fallback management
12. **Raj Adapter**: External schema integration (failure paths, evidence readiness, compliance)
13. **Governed Execution**: Pipeline that wraps all agent execution with enforcement + RL gating
14. **Ontology System**: Indian legal ontology + 42+ offense subtypes + dowry precision layer
15. **Procedure Intelligence**: 16 procedure files across 4 jurisdictions × 4 domains
16. **Response Enrichment**: Auto-generates timeline, glossary, evidence requirements from procedures

---

## 3. Frontend Analysis (`frontend/`)

### 3.1 Tech Stack

| Layer | Technology | Version |
|-------|-----------|---------|
| Framework | **React** | 18.2.0 |
| Build Tool | **Vite** | 7.3.1 |
| HTTP Client | **Axios** | 1.6.0 |
| Animations | **GSAP** | 3.14.2 |
| 3D Graphics | **OGL** | 1.0.11 |
| Notifications | **react-hot-toast** | 2.6.0 |
| Testing | **Playwright** (E2E), **Storybook** | 10.1.11 |
| Typography | Plus Jakarta Sans, Merriweather | Google Fonts |
| Deploy Config | **Vercel** (`vercel.json`) | — |

### 3.2 Component Inventory (48 files)

| Component | Size | Purpose |
|-----------|------|---------|
| **LegalDecisionDocument.jsx** | 39KB | AI-powered legal decision doc with evidence requirements + procedural timelines (India/UK/UAE) |
| **LegalConsultation.jsx** | 25KB | Full legal consultation interface |
| **LegalQueryCard.jsx** | 22KB | Primary chat interface — query submission + result display |
| **CaseTimelineGenerator.jsx** | 20KB | Interactive case timeline tool |
| **GravitasLegalDecisionScreen.jsx** | 17KB | Gravitas decision screen |
| **DecisionPage.jsx** | 17KB | Decision page with CSS (13KB) |
| **GravitasDecisionPanel.jsx** | 12KB | Decision panel + CSS (13KB) |
| **Documentation.jsx** | 12KB | API documentation viewer |
| **MultiJurisdictionCard.jsx** | 10KB | Multi-jurisdiction comparison |
| **Galaxy.jsx** | 10KB | OGL starfield background animation |
| **FeedbackButtons.jsx** | 9KB | User feedback (positive/negative) → RL signal |
| **GlossaryCard.jsx** | 9KB | Legal glossary card |
| **AuthPage.jsx** | 10KB | Login page with guest skip option |
| **LawAgentView.jsx** | 9KB | AI agent reasoning visualization |
| **LegalRouteCard.jsx** | 8KB | Legal route map card |
| **EnforcementStatusCard.jsx** | 8KB | Enforcement decision visualization |
| **TimelineCard.jsx** | 8KB | Timeline visualization card |
| **LegalConsultationCard.jsx** | 8KB | Consultation mini-card |
| **ErrorBoundary.jsx** | 7KB | React error boundary with fallback UI |
| **GlassSurface.jsx** | 7KB | Glassmorphism surface component |
| **LegalGlossary.jsx** | 6KB | Legal glossary page |
| **LegalOSDashboard.jsx** | 5KB | Module selector dashboard |
| **ErrorHandlingIntegration.jsx** | 5KB | Error handling integration |
| **StaggeredMenu.jsx** | 5KB | Animated staggered navigation |
| **GooeyNav.jsx** | 5KB | Gooey animation navigation |
| **JurisdictionProcedure.jsx** | 5KB | Procedure explorer |
| **CaseSummaryCard.jsx** | 5KB | Case summary visualization |
| **ProceduralTimeline.jsx** | 6KB | Procedural timeline view |
| **ServiceOutage.jsx** | 4KB | Service outage state |
| **ApiErrorState.jsx** | 3KB | API error display |
| **JurisdictionInfoBar.jsx** | 2KB | Jurisdiction info bar |
| **OfflineBanner.jsx** | 2KB | Offline degraded mode banner |
| **SkeletonLoader.jsx** | 2KB | Loading skeleton |
| **GlareHover.jsx** | 1KB | Glare hover effect |
| **ConfidenceIndicator.jsx** | 1KB | Confidence score indicator |
| **SessionStatus.jsx** | 1KB | Session status display |
| **AnimatedText.jsx** | 1KB | Animated text component |
| **DisclaimerBox.jsx** | 0.4KB | Legal disclaimer box |

### 3.3 API Service Layer (5 files)

| File | Lines | Purpose | Base URL |
|------|-------|---------|----------|
| `nyayaApi.js` | 718 | **Primary** — Full API client with interceptors, service outage detection, validators | `apiConfig.ts` → env var |
| `nyayaBackendApi.js` | 155 | **Secondary** — Direct backend client | `https://nyaya-ai-0f02.onrender.com` (HARDCODED) |
| `apiService.js` | — | Generic fetch wrapper with timeout + toast | — |
| `apiConfig.ts` | — | Base URL config: `VITE_API_URL` env var or Render fallback | — |
| `offlineStore.js` | 56 | localStorage persistence for case intake during outages | N/A |

### 3.4 Custom Hooks (4 hooks)

| Hook | File | Purpose |
|------|------|---------|
| `useResiliency` | `hooks/useResiliency.js` | Offline detection, localStorage persistence, health polling (15s), auto-sync on recovery |
| `useGravitasDecision` | `hooks/useGravitasDecision.js` | Decision page state management |
| `useGooeyAnimation` | `hooks/useGooeyAnimation.js` | Gooey nav animation controller |
| `useServiceOutage` | `hooks/useServiceOutage.js` | Global service outage state |

### 3.5 Frontend Resilience Architecture

```
Normal Mode
    │
    ├── All API calls via nyayaApi.js interceptors
    │   ├── Request: injects trace ID headers
    │   └── Response: checks 5xx / network errors
    │
    ├── On 5xx / timeout / network error
    │   ├── onBackendFailure() callback fired
    │   ├── useResiliency hook catches it
    │   │   ├── setIsOffline(true)
    │   │   ├── offlineStore.save(currentCaseIntake)
    │   │   └── Starts health polling (15s intervals)
    │   └── OfflineBanner.jsx shown
    │
    ├── On /health returns 200
    │   ├── setIsOffline(false)
    │   ├── Stop polling
    │   └── syncToServer(pending data)
    │
    └── ServiceOutage.jsx (global outage state)
```

### 3.6 Key Frontend Capabilities

1. **Premium UI**: Galaxy starfield (OGL), glassmorphism, GSAP animations, glare hover
2. **Auth System**: Login page with guest skip (localStorage)
3. **Legal Query Chat**: Full query interface → backend → structured response display
4. **Decision Draft**: AI-powered legal decision document with evidence requirements + procedural timelines (India/UK/UAE)
5. **Law Agent View**: Agent reasoning chain visualization
6. **Multi-Jurisdiction**: Side-by-side jurisdiction comparison
7. **Case Timeline Generator**: Interactive case timeline tool
8. **Procedure Explorer**: Jurisdiction procedure browsing
9. **Legal Glossary**: Context-aware legal term definitions
10. **Offline Resilience**: Degraded mode, localStorage persistence, auto-sync
11. **Error Handling**: ErrorBoundary, ServiceOutage, ApiErrorState
12. **Feedback → RL**: Positive/negative buttons feed into backend RL engine

---

## 4. Current Integration Status

### 4.1 What's Already Connected ✅

| Integration Point | Status | Details |
|-------------------|--------|---------|
| API Base URL | ✅ | `apiConfig.ts` → `VITE_API_URL` env var → Render fallback |
| `POST /nyaya/query` | ✅ | `legalQueryService.submitQuery()` → `LegalQueryCard.jsx` + `LegalDecisionDocument.jsx` |
| `POST /nyaya/multi_jurisdiction` | ✅ | `legalQueryService.submitMultiJurisdictionQuery()` |
| `POST /nyaya/explain_reasoning` | ✅ | `legalQueryService.explainReasoning()` |
| `POST /nyaya/feedback` | ✅ | `legalQueryService.submitFeedback()` via `FeedbackButtons.jsx` |
| `GET /nyaya/trace/{id}` | ✅ | `legalQueryService.getTrace()` |
| `GET /health` | ✅ | `healthService.checkHealth()` + polling in `useResiliency` |
| All 7 procedure endpoints | ✅ | Full `procedureService` wired |
| Vite dev proxy | ✅ | `/api` → `http://localhost:8000` |
| CORS | ✅ | `allow_origins=["*"]` in backend |
| Error interceptors | ✅ | 5xx detection, network error, timeout handling |
| Offline resilience | ✅ | `useResiliency` + `offlineStore` + `OfflineBanner` |
| Enforcement display | ✅ | `LegalQueryCard.jsx` renders ALLOW/BLOCK/ESCALATE with color-coded badges |
| Confidence breakdown | ✅ | Grid display of all confidence scores |
| Processing route | ✅ | Agent route visualization in `LegalQueryCard.jsx` |

### 4.2 What's NOT Connected / Broken ❌

| Issue | Severity | Details |
|-------|----------|---------|
| **7 missing backend endpoints** | 🔴 Critical | Frontend `casePresentationService` calls endpoints that don't exist in backend |
| **Dual API clients** | 🟡 Medium | `nyayaBackendApi.js` hardcodes Render URL, redundant with `nyayaApi.js` |
| **Wrong env var in vercel.json** | 🟡 Medium | Uses `NEXT_PUBLIC_API_URL` (Next.js) instead of `VITE_API_URL` |
| **RL Signal endpoint missing** | 🔴 Critical | Frontend sends `POST /nyaya/rl_signal` but no backend route |
| **SC India Scraper** | 🟡 Low | Returns mock data, not actual Supreme Court judgments |
| **Raj Evidence Rule** | 🟢 Info | `RajEvidenceReadinessRule.evaluate()` always returns ALLOW (pass-through) |
| **Provenance ledger file location** | 🟡 Medium | `provenance_ledger.json` and `enforcement_ledger.json` write to CWD, not configurable |
| **KSA jurisdiction** | 🟢 Info | Procedure data exists for KSA but JurisdictionDetector only supports IN/UK/UAE |
| **Stale backup files** | 🟢 Info | `App_Old_Backup.jsx`, `App_New.jsx`, `router_broken.py`, `LegalQueryCard_BACKUP.jsx` |
| **Empty `backend/frontend/` folder** | 🟢 Info | Leftover empty directory |

### 4.3 Missing Backend Endpoints (Frontend expects but backend lacks)

```
❌ GET  /nyaya/case_summary          → called by casePresentationService.getCaseSummary()
❌ GET  /nyaya/legal_routes           → called by casePresentationService.getLegalRoutes()
❌ GET  /nyaya/timeline               → called by casePresentationService.getTimeline()
❌ GET  /nyaya/glossary               → called by casePresentationService.getGlossary()
❌ GET  /nyaya/jurisdiction_info      → called by casePresentationService.getJurisdictionInfo()
❌ GET  /nyaya/enforcement_status     → called by casePresentationService.getEnforcementStatus()
❌ POST /nyaya/rl_signal              → called by legalQueryService.sendRLSignal()
```

---

## 5. Security & Sensitive Data Disclosure

> ⚠️ **CAUTION: Exposed secrets found in committed files — must be rotated immediately!**

| Item | File | Risk Level |
|------|------|------------|
| **Groq API Key** | `.env` line 25 | 🔴 EXPOSED: `gsk_3svA2X5BqGYxe6b78f2z...` |
| **HMAC Secret Key** | `.env` line 8 | 🟡 WEAK: `nyaya-ai-secret-key-2025-production-change-this-in-production` |
| **Render URL** | `vercel.json` + `nyayaBackendApi.js` | 🟡 PUBLIC: Backend URL visible in source |
| **CORS wildcard** | `api/main.py` line 37 | 🟡 `allow_origins=["*"]` — should restrict in production |
| **`.env` in gitignore** | `.gitignore` | ✅ Listed (but may already be committed) |

---

## 6. File Cleanup Needed

| File/Folder | Location | Action |
|-------------|----------|--------|
| `router_broken.py` | `backend/api/` | DELETE — broken backup |
| `App_Old_Backup.jsx` | `frontend/src/` | DELETE — old backup |
| `App_New.jsx` | `frontend/src/` | DELETE — unused |
| `LegalQueryCard_BACKUP.jsx` | `frontend/src/components/` | DELETE — 29 bytes, empty |
| `backend/frontend/` | `backend/` | DELETE — empty folder |

---

## 7. Complete File Count

### Backend
| Category | Count |
|----------|-------|
| Python modules | ~40 |
| Test files | ~30 |
| Legal data files (db/) | 52 |
| Procedure data + schemas | 26 |
| Addon/ontology data | 4 |
| Raj schemas | 3 |
| Vector index files | 2 |
| Case law files | 5 |
| Event schemas | 3 |
| Config files | 6 |
| Documentation | ~15 |
| **Total** | **~186 files** |

### Frontend
| Category | Count |
|----------|-------|
| React Components (+CSS) | 48 |
| API Services | 5 |
| Custom Hooks | 4 |
| Lib/Utils | 4 |
| E2E Tests | 1 |
| Config | 5 |
| **Total** | **~67 files** |

### Grand Total: ~253 files across both folders

---

*Report generated after deep analysis of every module, file, and data asset in both repositories.*
