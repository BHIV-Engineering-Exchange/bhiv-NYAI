# Nyaya AI — Execution Walkthrough

> ⚠️ **LEGACY WALKTHROUGH** — Retained as a historical record. It traces the **pre-TANTRA v3** execution path: §14 references the removed `backend/enforcement_engine/engine.py` and the obsolete `ALLOW_INFORMATIONAL / RESTRICT / SAFE_REDIRECT` enforcement decisions. The current system is TANTRA v3 (advisory `INFORM / REVIEW / ESCALATE / INSUFFICIENT_DATA`, no blocking). See the authoritative flow in [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md).

> This document traces the exact execution path of a user query through the entire system.

---

## Step-by-Step Flow

### 1. User Submits Query (Frontend)

**Component**: `frontend/src/components/LegalQueryCard.jsx`

User types: *"What is the punishment for theft in India?"*
Selects jurisdiction: *India*

```javascript
// LegalQueryCard.jsx → calls nyayaApi.js
const result = await legalQueryService.submitQuery({
  query: "What is the punishment for theft in India?",
  jurisdiction_hint: "India",
  user_context: { role: "citizen", confidence_required: true }
});
```

### 2. API Client Sends Request

**File**: `frontend/src/services/nyayaApi.js`

```
POST /nyaya/query
Headers: Content-Type: application/json
Body: { query, jurisdiction_hint, user_context }
```

Interceptors inject trace headers and monitor for 5xx/network errors.

### 3. Router Receives Request

**File**: `backend/api/router.py` → `query_legal()`

### 4. Query Cleaning

**File**: `backend/services/query_cleaner.py`

Input: `"What is the punishment for theft in India?"`
Output: `"punishment theft india"`

### 5. Query Understanding

**File**: `backend/services/query_understanding.py`

Detects: `domain = "criminal"`, `intent = "informational"`

### 6. Query Expansion

**File**: `backend/services/query_expander.py`

Generates multiple search queries for better recall.

### 7. Hybrid Retrieval (BM25 + FAISS)

**File**: `backend/services/retriever.py`

```
BM25Okapi: sparse token scores (k1=1.5, b=0.75)
FAISS: BAAI/bge-m3 dense embeddings → Inner Product
Score fusion: additive combination
Result: ranked candidate sections
```

### 8. Cross-Encoder Reranking

**File**: `backend/services/reranker.py`

Timeout: 8s. Reranks candidates by semantic relevance.

### 9. Legal Reasoning Rules

**File**: `backend/services/legal_reasoner.py`

Applies domain-specific reasoning rules. May inject additional statutes.

### 10. EnhancedLegalAdvisor

**File**: `backend/clean_legal_advisor.py`

The main decision engine. Provides:
- Matched statutes (IPC 378, 379)
- Procedural steps
- Remedies
- Confidence score

### 11. Case Law Retrieval

**File**: `backend/core/caselaw/retriever.py`

Retrieves relevant case laws by title, court, year, and principle matching.

### 12. Response Enrichment

**File**: `backend/core/response/enricher.py`

Adds: timeline, glossary, evidence_requirements based on domain + jurisdiction.

### 13. Groq LLM Answer Generation

**File**: `backend/core/llm/groq_client.py`

Model: `llama-3.3-70b-versatile` (20s timeout)
Fallback: Deterministic local response if Groq unavailable.

### 14. Enforcement Decision

**File**: `backend/enforcement_engine/engine.py`

```
EnforcementSignal created with:
  case_id, country, domain, confidence, user_request, trace_id

9 Rules evaluated in order:
  INTENT-001 → detects "informational" intent → ALLOW_INFORMATIONAL
  CONST-001 → not constitutional domain → skipped
  JURIS-001 → country matches → passed
  SAFETY-001 → no bypass patterns → passed
  CONF-001 → confidence 0.85 > 0.3 threshold → passed
  PROC-001 → not appeals → skipped
  RAJ rules → passed

Result: ALLOW_INFORMATIONAL
```

### 15. Response Cached

**File**: `backend/api/router.py` → `ResponseCache`

```python
response_cache.set(trace_id, enriched_response)
```

### 16. Response Returned to Frontend

```json
{
  "domain": "criminal",
  "jurisdiction": "IN",
  "enforcement_decision": "ALLOW_INFORMATIONAL",
  "statutes": [
    { "act": "Indian Penal Code", "year": 1860, "section": "378", "title": "Theft" },
    { "act": "Indian Penal Code", "year": 1860, "section": "379", "title": "Punishment for theft" }
  ],
  "confidence": { "overall": 0.70, "jurisdiction": 0.85, "domain": 0.75 },
  "trace_id": "trace_20260416_140406_367909"
}
```

### 17. Frontend Renders Decision

**Component**: `LegalQueryCard.jsx` + `LegalDecisionDocument.jsx`

- Enforcement badge: ✅ ALLOWED (green)
- Statutes table: IPC §378, §379
- Confidence bars: 70% overall
- Legal analysis text
- Procedural steps accordion
- Timeline visualization
- Glossary terms

### 18. User Sends Feedback

**Component**: `FeedbackButtons.jsx`

```
POST /nyaya/rl_signal
{ trace_id, signal_type: "feedback", user_feedback: "positive" }
```

→ RewardEngine computes reward: +0.08
→ Logged to enforcement provenance ledger

---

## Enforcement Path Examples

| Query | Decision | Rule Triggered | Reason |
|-------|----------|----------------|--------|
| "Punishment for theft in India" | `ALLOW_INFORMATIONAL` | INTENT-001 | Informational intent detected |
| "How to murder someone" | `RESTRICT` | INTENT-001 | Malicious pattern matched |
| "Some general legal stuff" | `SAFE_REDIRECT` | CONF-001 | Low confidence, ambiguous query |
