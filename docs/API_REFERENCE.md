# NYAI — API Reference

> Verified against `backend/api/*.py` route decorators (2026-08-14). 80 endpoints total. Base URL: `http://localhost:8000` locally, `https://nyai-backend-n9h8.onrender.com` in production.

---

## 1. Authentication & Headers

- **Header**: `X-API-Key: <NYAI_API_KEY>` — required on protected prefixes `/nyaya/`, `/evidence/`, `/knowledge/`, `/workspace/`, `/graph/`.
- **Read-only ecosystem access**: `ECOSYSTEM_READ_API_KEY` accepted for `GET` on `/knowledge/*` and `/graph/*`.
- **Trace propagation**: send `X-Trace-Id` to pin a trace; otherwise a `uuid4` is generated. The header is echoed on every response.
- **Protected-route failure modes**:
  - Missing/empty key → `401 {error_code: "UNAUTHORIZED"}`
  - Wrong key → `401 {error_code: "INVALID_API_KEY"}`
  - `NYAI_API_KEY` not configured → `503 {error_code: "AUTH_CONFIGURATION_ERROR"}` (fail-closed)
- **Open (no auth)**: `/`, `/health`, `/health/live`, `/health/ready`, `/metrics`, `/docs`, `/redoc`, `/ecosystem/*`.

**Error envelope** (all errors):
```json
{
  "error_code": "VALIDATION_ERROR | UNAUTHORIZED | INVALID_API_KEY | INTERNAL_ERROR | ...",
  "message": "human readable",
  "trace_id": "uuid"
}
```

---

## 2. System Endpoints

### `GET /` — API info
Unprotected. Returns service name/version and endpoint map.

### `GET /health` — Liveness
```json
{ "status": "healthy", "service": "nyaya-api-gateway", "version": "1.0.0", "timestamp": "..." }
```

### `GET /health/live` — Process liveness → `200 {status: "healthy"}`

### `GET /health/ready` — Readiness (dependencies)
Returns `200` or `503` with `{status, dependencies, checks_passed}`. Dependencies: output bucket, ledger, legal advisor, GROQ key, evidence repo, knowledge repo, ecosystem (bucket_producer, bhiv_core, insightflow, clo). Each check: `PASS | DEGRADED | DISABLED | FAIL`.

### `GET /metrics` — Prometheus-style counters
```json
{ "requests": {...}, "uptime_seconds": ..., "auth_failure_count": ..., "rate_limited_count": ... }
```

---

## 3. Legal Query Endpoints (`/nyaya` — requires `X-API-Key`)

### `POST /nyaya/query`
Executes a single-jurisdiction legal query.

**Request**
```json
{
  "query": "What are the penalties for theft under Indian law?",
  "jurisdiction_hint": "India",
  "domain_hint": "criminal",
  "user_context": { "role": "citizen", "confidence_required": true }
}
```
`user_context.role` enum: `citizen | lawyer | judge | researcher`. **`query` and `user_context` are required**; missing `user_context` → `422`.

**Response (TANTRA v3 — advisory)** — 11 required top-level fields:
```json
{
  "schema_version": "tantra_v3",
  "trace_id": "uuid",
  "request_id": "deterministic-id",
  "input_hash": "sha256...",
  "timestamp": "2026-08-14T...Z",
  "domain": "criminal",
  "jurisdiction": "IN",
  "jurisdiction_detected": "India",
  "jurisdiction_confidence": 0.94,
  "confidence": {
    "overall": 0.85, "jurisdiction": 0.9, "domain": 0.85,
    "statute_match": 0.8, "procedural_match": 0.75
  },
  "statutes": [ { "act": "Indian Penal Code", "year": 1860, "section": "378", "title": "Theft ..." } ],
  "case_laws": [ { "title": "...", "court": "...", "year": 2020, "principle": "..." } ],
  "legal_route": ["jurisdiction_detector", "enhanced_legal_advisor", "ontology_resolver", "case_law_retriever"],
  "constitutional_articles": ["Article 14", "Article 21"],
  "provenance_chain": [ { "timestamp": "...", "event": "...", "agent": "...", "sections_found": 4, "case_laws_found": 3, "jurisdiction_detected": "India", "jurisdiction_confidence": 0.94 } ],
  "reasoning_trace": { "jurisdiction_detection": { "detected": "IN", "confidence": 0.94, "user_provided": false } },
  "facts": [...], "analysis": [...], "explanation_chain": [...], "risk_flags": [...],
  "legal_context": {...},
  "recommendation": { "type": "INFORM", "confidence": 0.85, "rationale": "..." },
  "answer": "LLM or deterministic explanation text",
  "answer_source": "groq_llm | local_fallback | skipped",
  "answer_model": "llama-3.1-8b-instant" | null,
  "timeline": [...], "glossary": [...], "evidence_requirements": [...],
  "remedies": [...], "procedural_steps": [...], "metadata": { "formatted": {...} },
  "determinism_proof": { "input_hash": "...", "output_hash": "...", "version": "3.0.0" },
  "observer_validation": { "validation_status": "PASS", "schema_valid": true, ... }
}
```

**Status codes**: `200` success · `401` bad/missing key · `422` schema violation · `429` rate-limited · `500` fail-closed error · `503` auth not configured.

### `POST /nyaya/multi_jurisdiction`
Body: `{ "query": "...", "jurisdictions": ["India", "UK", "UAE"] }`. Returns `comparative_analysis` keyed by jurisdiction + `confidence` + `trace_id`.

### `POST /nyaya/explain_reasoning`
Body: `{ "trace_id": "...", "explanation_level": "detailed" }`. Reuses cached trace.

### `POST /nyaya/feedback`
Body: `{ "trace_id": "...", "rating": 4, "feedback_type": "correctness", "comment": "..." }` → `{status: "recorded", ...}`.

### `POST /nyaya/tantra_flow`
TANTRA governance execution entry. Requires `X-API-Key`.

### `POST /nyaya/rl_signal`
Body: `{ "trace_id": "...", "signal_type": "feedback", "user_feedback": "positive|negative|neutral", "outcome_tag": "..." }` → RL reward computation.

### `GET /nyaya/trace/{trace_id}`
Full audit trail: `event_chain` (signed), `agent_routing_tree`, `jurisdiction_hops`, `rl_reward_snapshot`, `context_fingerprint`, `nonce_verification`, `signature_verification`.

### `GET /nyaya/output/{trace_id}`
Raw output-bucket record for a trace.

### Downstream cached endpoints (read from ResponseCache after a `/nyaya/query`):
- `GET /nyaya/case_summary?trace_id=...`
- `GET /nyaya/legal_routes?trace_id=...`
- `GET /nyaya/timeline?trace_id=...`
- `GET /nyaya/glossary?trace_id=...`
- `GET /nyaya/jurisdiction_info?jurisdiction=IN|UK|UAE|KSA` (static metadata; `IN → code "IN", name "Republic of India"`, etc.)
- `GET /nyaya/recommendation_status?trace_id=...`

---

## 4. Procedure Intelligence (`/nyaya/procedures` — requires `X-API-Key`)

| Method | Path | Body / Params |
|---|---|---|
| POST | `/nyaya/procedures/analyze` | `{country, domain, current_step}` |
| GET | `/nyaya/procedures/summary/{country}/{domain}` | `india/uae/uk/ksa` × `criminal/civil/family/consumer_commercial` |
| POST | `/nyaya/procedures/evidence/assess` | `{canonical_step, available_documents: [...]}` |
| POST | `/nyaya/procedures/failure/analyze` | `{failure_code}` |
| POST | `/nyaya/procedures/compare` | `{countries: [...], domain}` |
| GET | `/nyaya/procedures/list` | All available procedures |
| GET | `/nyaya/procedures/schemas` | Schema catalog |
| GET | `/nyaya/procedures/enhanced_analysis/{jurisdiction}/{domain}` | Enhanced DB-backed analysis (requires `query`, nonce) |
| GET | `/nyaya/procedures/domain_classification/{jurisdiction}` | Domain classification for a query |
| GET | `/nyaya/procedures/legal_sections/{jurisdiction}/{domain}` | Sections for a jurisdiction+domain |

**Canonical steps**: `CRIME_REPORTING, INVESTIGATION, PRE_TRIAL_RELEASE_DECISION, PROSECUTION_DECISION, CASE_ALLOCATION, SETTLEMENT_ATTEMPT, MEDIATION_ATTEMPT, TRIAL, JUDGMENT, APPEAL`.
**Evidence states**: `EVIDENCE_COMPLETE | EVIDENCE_PARTIAL | EVIDENCE_MISSING`.
**Failure codes**: `MISSING_MANDATORY_DOCUMENTS, NON_APPEARANCE_BY_COMPLAINANT, NON_APPEARANCE_BY_DEFENDANT, JURISDICTION_REJECTED, INSUFFICIENT_PRIMA_FACIE_CASE, LIMITATION_PERIOD_EXPIRED, SERVICE_OF_NOTICE_FAILED, STATUTORY_TIME_LIMIT_EXCEEDED`.

---

## 5. Evidence (`/evidence` — requires `X-API-Key`)

| Method | Path | Purpose |
|---|---|---|
| GET | `/evidence/{trace_id}` | Full `EvidencePackage` for a trace |
| GET | `/evidence/search?date_from=&date_to=&evidence_version=` | Multi-filter search |
| GET | `/evidence/hash/{input_hash}` | Lookup by input hash |
| GET | `/evidence/recommendation/{type}` | Filter by recommendation type |
| GET | `/evidence/jurisdiction/{country}` | Filter by jurisdiction |
| GET | `/evidence/statute?keyword=` | Statute keyword search |
| GET | `/evidence/version/{version}` | Filter by evidence format version |
| POST | `/evidence/verify` | Entry integrity check |
| POST | `/evidence/verify/chain` | Ledger chain check |
| POST | `/evidence/compare` | Determinism comparison between two traces |
| POST | `/evidence/export` | JSON or summary export |

---

## 6. Ecosystem (`/ecosystem` — unauthenticated)

- `GET /ecosystem/bhiv-core/health`
- `GET /ecosystem/bucket/health`
- `GET /ecosystem/clo/health`
- `GET /ecosystem/insightflow/health`
- `GET /ecosystem/samachar/health` → `{status: "PASS|DEGRADED|DISABLED"}`
- `GET /ecosystem/svacs/health`
- `POST /ecosystem/samachar/event` (body must be a dict — list → `422`)
- `POST /ecosystem/svacs/event`

---

## 7. Knowledge Repository (`/knowledge` — requires `X-API-Key`; GET also accepts `ECOSYSTEM_READ_API_KEY`)

| Method | Path | Purpose |
|---|---|---|
| POST | `/knowledge/assets` | Register asset |
| GET | `/knowledge/assets` | List assets |
| GET | `/knowledge/assets/{asset_id}` | Get asset |
| GET | `/knowledge/assets/{asset_id}/versions` | Version history |
| GET | `/knowledge/assets/{asset_id}/versions/{version_id}` | Specific version |
| GET | `/knowledge/assets/{asset_id}/state` | Current state |
| GET | `/knowledge/assets/{asset_id}/integrity` | Integrity verification |
| GET | `/knowledge/assets/{asset_id}/approval-trail` | Promotion audit trail |
| PATCH | `/knowledge/assets/{asset_id}` | Update (creates new version) |
| POST | `/knowledge/assets/{asset_id}/promote` | Promote (draft → review → approved) |
| POST | `/knowledge/assets/{asset_id}/rollback` | Rollback |
| POST | `/knowledge/ingest` | Ingest a new document |
| GET | `/knowledge/ingestion` | Ingestion log |
| GET | `/knowledge/ingestion/{log_id}` | Single ingestion record |

## 8. Workspace (`/workspace` — requires `X-API-Key`)

| Method | Path | Purpose |
|---|---|---|
| POST | `/workspace/documents/upload` | Upload document |
| GET | `/workspace/documents/{asset_id}/versions` | Version history |
| GET | `/workspace/documents/{doc_id_a}/compare/{doc_id_b}` | Diff/compare |
| GET | `/workspace/documents/{doc_id}/annotations` | List annotations |
| GET | `/workspace/documents/{doc_id}/audit` | Audit history |
| PATCH | `/workspace/documents/{doc_id}/metadata` | Update metadata |
| POST | `/workspace/annotations` | Add annotation |

## 9. Graph Runtime (`/graph` — requires `X-API-Key`; GET also accepts `ECOSYSTEM_READ_API_KEY`)

| Method | Path | Purpose |
|---|---|---|
| POST | `/graph/entities` | Register entity |
| GET | `/graph/entities` | List entities |
| GET | `/graph/entities/{entity_id}` | Get entity |
| GET | `/graph/entities/{entity_id}/dependencies` | Dependency lookup |
| GET | `/graph/entities/{entity_id}/impact` | Impact analysis |
| GET | `/graph/entities/{entity_id}/citations` | Citation relationships |
| GET | `/graph/path` | Path finding |
| POST | `/graph/relationships` | Register relationship |

## 10. Debug (`/debug` — **only when `ENABLE_DEBUG_ROUTES=true`**)

- `GET /debug/generate-nonce`
- `GET /debug/nonce-state`
- `POST /debug/test-nonce`

---

## 11. Sample Requests (curl)

```bash
# Health (no auth)
curl http://localhost:8000/health

# Legal query (auth required)
curl -X POST http://localhost:8000/nyaya/query \
  -H "Content-Type: application/json" \
  -H "X-API-Key: $NYAI_API_KEY" \
  -d '{"query":"What are the penalties for theft in India?","jurisdiction_hint":"India","user_context":{"role":"citizen","confidence_required":true}}'

# Expect 401 (no key)
curl -X POST http://localhost:8000/nyaya/query \
  -H "Content-Type: application/json" \
  -d '{"query":"theft","user_context":{"role":"citizen"}}'

# Trace retrieval
curl -X GET http://localhost:8000/nyaya/trace/<trace_id> \
  -H "X-API-Key: $NYAI_API_KEY"

# Procedure summary
curl -X GET "http://localhost:8000/nyaya/procedures/summary/india/criminal" \
  -H "X-API-Key: $NYAI_API_KEY"

# Readiness
curl http://localhost:8000/health/ready
```

> A Postman collection with full request/response examples ships at `backend/Nyaya_AI_Backend.postman_collection.json`.

---

*Cross-checked against route decorators on 2026-08-14. If an endpoint is missing here, it is documented in [Archive](ARCHIVE.md) as removed.*
