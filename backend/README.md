# Nyaya AI - Sovereign Legal Intelligence Platform

> ⚠️ **ARCHIVED / SUPERSEDED** — This file is a historical Phase IV document, kept for reference. The authoritative documentation now lives in the root `docs/` hub: [Setup](../docs/SETUP.md) · [API Reference](../docs/API_REFERENCE.md) · [Architecture](../docs/ARCHITECTURE.md) · [Testing](../docs/TESTING.md) · [Deployment](../docs/DEPLOYMENT.md) · [Validation Report](../docs/validation/VALIDATION_REPORT.md).

## Phase IV: Constitutional Evidence Infrastructure (23 June 2026)

| | |
|--|--|
| **Status** | PHASE IV COMPLETE — evidence is the primary architectural product |
| **Contract** | `final_decision_contract.json` v2.0.0 · `schema_version` `tantra_v3` |
| **Evidence schema** | `evidence_v1` / format `1.0.0` |
| **Tests** | 14 evidence + 15 production + 6 convergence = **35/35** |
| **Review packet** | [`REVIEW_PACKET.md`](../REVIEW_PACKET.md) |
| **Phase IV docs** | [`../Shashank-Constitutional Evidence Infrastructure (NYAI__ Phase IV Production Transition)/`](../Shashank-Constitutional%20Evidence%20Infrastructure%20(NYAI__%20Phase%20IV%20Production%20Transition)/) — includes complete `EvidencePackage` JSON in `Evidence_Model.md` |

### Evidence Architecture

```
POST /nyaya/query → OutputBucket (JSONL) → EvidencePackage (on demand)
                      ↓
              EvidenceRepository (L2 persistent)
                      ↓
              /evidence/* API (auth required)
```

Secondary `/nyaya/*` endpoints use `response_cache` (L1) with `EvidenceRepository` fallback after restart.

### Evidence API (`/evidence/*` — requires `X-API-Key`)

| Method | Path | Purpose |
|--------|------|---------|
| GET | `/evidence/{trace_id}` | Full EvidencePackage |
| GET | `/evidence/search` | Multi-filter search (`date_from`, `date_to`, `evidence_version`) |
| GET | `/evidence/hash/{input_hash}` | Lookup by input hash |
| GET | `/evidence/recommendation/{type}` | Filter by recommendation |
| GET | `/evidence/jurisdiction/{country}` | Filter by jurisdiction |
| GET | `/evidence/statute?keyword=` | Statute keyword search |
| GET | `/evidence/version/{version}` | Filter by evidence format version |
| POST | `/evidence/verify` | Entry integrity check |
| POST | `/evidence/verify/chain` | Ledger chain check |
| POST | `/evidence/compare` | Determinism comparison between two traces |
| POST | `/evidence/export` | JSON or summary export |

### Run Tests

```bash
cd backend
pytest tests/test_evidence_infrastructure.py tests/test_production_hardening.py tests/test_tantra_convergence.py -v
```

---

## TANTRA Convergence Status (12 June 2026)

| | |
|--|--|
| **Status** | TANTRA-CONVERGENCE READY — all 8 gaps PASS |
| **Branch** | `feature/tantra-convergence-ready` |
| **Contract** | `final_decision_contract.json` v2.0.0 · `schema_version` `tantra_v3` |
| **Recommendation types** | INFORM · REVIEW · ESCALATE · INSUFFICIENT_DATA (advisory only) |
| **Tests** | `tests/test_tantra_convergence.py` — 6/6 pass |
| **Review packet** | [`REVIEW_PACKET.md`](../REVIEW_PACKET.md) (authoritative, project root) |
| **Sprint deliverables** | [`../SHASHANK-NYAI_CONVERGENCE_IMPLEMENTATION_PLAN/`](../SHASHANK-NYAI_CONVERGENCE_IMPLEMENTATION_PLAN/) |
| **Implementation guide** | [`../NYAI_CONVERGENCE_REMEDIATION_GUIDE.md`](../NYAI_CONVERGENCE_REMEDIATION_GUIDE.md) |

> **Note:** Sections below describing the sovereign enforcement engine are **legacy architecture documentation** from before the convergence sprint. The live API is advisory-only; `enforcement_decision` is absent from `backend/api/` and `frontend/src/`.

---

## 🔍 Project Overview

Nyaya AI is a sovereign-compliant multi-agent legal intelligence platform designed to provide transparent, auditable legal analysis across multiple jurisdictions (India, UK, UAE). The system follows a modular architecture that ensures:

- **Sovereign Provenance**: Complete audit trail with signed events and hash chaining
- **Multi-jurisdictional Support**: Legal analysis across India, UK, and UAE jurisdictions
- **Constitutional Compliance**: Special handling for Indian constitutional law
- **Real-time Feedback**: Reinforcement learning engine for continuous improvement
- **API-first Design**: Clean, well-documented RESTful endpoints

## 🏗️ System Architecture

The Nyaya AI backend is composed of 7 core modules that work together to provide a comprehensive legal intelligence platform:

### 1. API Gateway (FastAPI)

- Entry point for all client requests
- Handles authentication, rate limiting, and request routing
- Provides standardized response formats
- Implements CORS and security middleware
- **NEW**: Integrated with sovereign enforcement engine for governance checks

### 2. Sovereign Agents

- **BaseAgent**: Core functionality with ID, jurisdiction, and capabilities
- **LegalAgent**: Specialized for legal query processing
- **ConstitutionalAgent**: Handles constitutional law references (India-specific)
- **JurisdictionRouterAgent**: Routes queries to appropriate legal agents

### 3. Jurisdiction Router

- **Resolver Pipeline**: Determines the most appropriate jurisdiction for queries
- **Confidence Aggregator**: Combines confidence scores from multiple agents
- **Fallback Manager**: Handles low-confidence scenarios with alternative jurisdictions

### 4. Sovereign Enforcement Engine

- **Enforcement Engine**: Makes deterministic governance decisions (ALLOW/SOFT_REDIRECT/BLOCK/ESCALATE)
- **Rules Engine**: Applies constitutional, jurisdictional, safety, and compliance rules
- **Decision Model**: Standardized decision objects with rule_id, policy_source, and reasoning
- **Signer**: Cryptographic signing of all enforcement decisions

### 5. Governed Execution Pipeline

- **Execution Control**: Ensures all agent execution passes through enforcement
- **Fallback Handler**: Governs fallback procedures
- **RL Controller**: Regulates reinforcement learning updates

### 6. RL Engine (Reinforcement Learning)

- **Feedback Processor**: Receives and processes user feedback
- **Performance Memory**: Stores agent performance metrics
- **Reward Engine**: Computes +reward/-penalty based on feedback scores (1-5)

### 7. Provenance Chain

- **Event Signer**: Signs all events using HMAC-SHA256
- **Hash Chain Ledger**: Immutable chain of signed events
- **Lineage Tracer**: Tracks request lineage and provides audit trails
- **Nonce Manager**: Prevents replay attacks
- **Enforcement Ledger**: Logs all enforcement decisions, agent executions, and system events

### 8. Data Bridge

- **JSON Loader**: Safely loads legal datasets without modification
- **Validator**: Ensures data integrity and schema compliance
- **Standard Schemas**: Section, Act, and Case objects with jurisdiction tags

### 9. Case Law Retrieval System

- **Case Law Loader**: Loads judicial precedents from JSON files
- **Case Law Retriever**: Keyword-based matching for relevant precedents
- **Domain Filtering**: Returns only cases matching query domain
- **Jurisdiction Filtering**: Returns only cases from relevant jurisdiction
- **Top-K Selection**: Returns most relevant 3 cases per query

### 10. Jurisdiction Detection System

- **Jurisdiction Detector**: Automatically infers jurisdiction from user queries
- **Keyword Heuristics**: Detects legal acts, terms, geographic indicators, currency
- **Confidence Scoring**: Provides 0.0-1.0 confidence for detection accuracy
- **User Hint Precedence**: User-provided hints always override automatic detection
- **Default Behavior**: Falls back to India (IN) with 0.5 confidence when no indicators found

## 📡 API Documentation

### Base URL

`http://localhost:8000` (default)

### Endpoints

#### POST `/nyaya/query`

Execute a single-jurisdiction legal query with sovereign enforcement.

**Request Body:**

```json
{
  "query": "What are the penalties for theft under Indian law?",
  "jurisdiction_hint": "India",
  "domain_hint": "criminal",
  "user_context": {
    "role": "citizen",
    "confidence_required": true
  }
}
```

**Success Response:**

```json
{
  "domain": "criminal",
  "jurisdiction": "IN",
  "jurisdiction_detected": "IN",
  "jurisdiction_confidence": 0.94,
  "confidence": {
    "overall": 0.85,
    "jurisdiction": 0.90,
    "domain": 0.85,
    "statute_match": 0.80,
    "procedural_match": 0.75
  },
  "legal_route": ["jurisdiction_detector", "enhanced_legal_advisor", "ontology_resolver", "case_law_retriever"],
  "statutes": [
    {
      "act": "Indian Penal Code",
      "year": 1860,
      "section": "378",
      "title": "Theft - Whoever intends to take dishonestly any movable property"
    }
  ],
  "case_laws": [
    {
      "title": "State v. Accused (2020)",
      "court": "Supreme Court of India",
      "year": 2020,
      "principle": "Theft requires dishonest intention at the time of taking property"
    }
  ],
  "constitutional_articles": ["Article 14", "Article 21"],
  "provenance_chain": [
    {
      "timestamp": "2024-01-01T12:00:00",
      "event": "ontology_filtered_query_processed",
      "jurisdiction_detected": "IN",
      "jurisdiction_confidence": 0.94
    }
  ],
  "reasoning_trace": {
    "jurisdiction_detection": {
      "detected": "IN",
      "confidence": 0.94,
      "user_provided": false
    }
  },
  "trace_id": "uuid-string"
}
```

**Blocked Response:**

```json
{
  "status": "blocked",
  "reason": "governance enforced",
  "decision": "BLOCK",
  "trace_proof": { /* cryptographic proof */ },
  "enforcement_metadata": { /* enforcement decision details */ }
}
```

#### POST `/nyaya/multi_jurisdiction`

Execute parallel legal analysis across multiple jurisdictions with sovereign enforcement.

**Request Body:**

```json
{
  "query": "What are the rights of employees?",
  "jurisdictions": ["India", "UK", "UAE"]
}
```

**Success Response:**

```json
{
  "comparative_analysis": {
    "India": { /* NyayaResponse */ },
    "UK": { /* NyayaResponse */ },
    "UAE": { /* NyayaResponse */ }
  },
  "confidence": 0.78,
  "trace_id": "uuid-string",
  "enforcement_metadata": {
    "decision": "ALLOW",
    "rule_id": "GOVERNANCE-001",
    "policy_source": "Governance",
    "governance_approved": true
  }
}
```

**Blocked Response:**

```json
{
  "status": "blocked",
  "reason": "governance enforced",
  "decision": "BLOCK",
  "trace_proof": { /* cryptographic proof */ },
  "enforcement_metadata": { /* enforcement decision details */ }
}
```

#### POST `/nyaya/explain_reasoning`

Explain reasoning without re-executing agents.

**Request Body:**

```json
{
  "trace_id": "uuid-string",
  "explanation_level": "detailed"
}
```

#### POST `/nyaya/feedback`

Submit system-level RL feedback with sovereign enforcement.

**Request Body:**

```json
{
  "trace_id": "uuid-string",
  "rating": 4,
  "feedback_type": "correctness",
  "comment": "The response was accurate and helpful"
}
```

**Success Response:**

```json
{
  "status": "recorded",
  "trace_id": "uuid-string",
  "message": "Feedback recorded successfully",
  "enforcement_metadata": {
    "decision": "ALLOW",
    "rule_id": "GOVERNANCE-001",
    "policy_source": "Governance",
    "governance_approved": true
  }
}
```

**Blocked Response:**

```json
{
  "status": "blocked",
  "reason": "governance enforced",
  "decision": "BLOCK",
  "trace_proof": { /* cryptographic proof */ },
  "enforcement_metadata": { /* enforcement decision details */ }
}
```

#### GET `/nyaya/trace/{trace_id}`

Get full sovereign audit trail.

**Response:**

```json
{
  "trace_id": "uuid-string",
  "event_chain": [/* array of signed events */],
  "agent_routing_tree": {},
  "jurisdiction_hops": ["India"],
  "rl_reward_snapshot": {},
  "context_fingerprint": "fingerprint-string",
  "nonce_verification": true,
  "signature_verification": true
}
```

#### GET `/health`

Health check endpoint.

**Response:**

```json
{
  "status": "healthy",
  "service": "nyaya-api-gateway"
}
```

### Error Handling

All errors follow the standard error format:

```json
{
  "error_code": "ERROR_TYPE",
  "message": "Human-readable error message",
  "trace_id": "uuid-string"
}
```

## 🔐 Provenance & Security

### Event Signing

All events in the system are signed using HMAC-SHA256 with a configurable secret key. This ensures:

- Non-repudiation of events
- Integrity verification
- Audit trail authenticity

### Enforcement Decision Signing

All enforcement decisions are cryptographically signed to ensure:

- Authenticity of governance decisions
- Tamper-proof approval/rejection records
- Verifiable compliance with sovereignty rules

### Hash Chain

The provenance chain uses a linked-list structure where each event contains:

- Index in the chain
- Timestamp
- Event hash (SHA256 of the signed event)
- Previous event hash (creating the chain)
- Signed event data

### Enforcement Ledger

The sovereign enforcement ledger logs:

- All enforcement decisions (ALLOW, SOFT_REDIRECT, BLOCK, ESCALATE)
- Agent executions with governance approval
- Routing decisions with compliance verification
- RL updates with safety checks
- Refusals and escalations with justification

### Nonce Protection

A nonce system prevents replay attacks by ensuring each request has a unique, one-time use token.

### Trace Retrieval

Full audit trails can be retrieved using trace IDs, providing complete visibility into:

- Agent routing decisions
- Jurisdiction transitions
- Event signatures
- Chain integrity verification
- Enforcement approvals and rejections
- Governance compliance verification

## 🎯 RL Engine Explanation

### What is Rewarded

- High user ratings (4-5 stars)
- Positive feedback on clarity, correctness, and usefulness
- Successful query completions
- Accurate jurisdiction routing

### What is Penalized

- Low user ratings (1-2 stars)
- Negative feedback
- Incorrect legal information
- Low confidence responses
- Failed jurisdiction routing

### What is NOT Learned

- The system does NOT perform machine learning training
- No model weights are updated
- No neural network training occurs
- The system only adjusts confidence scores and routing decisions based on feedback

## 🚀 How to Run

### Prerequisites

- Python 3.7+
- FastAPI
- Uvicorn
- Required dependencies (see requirements below)

### Environment Variables

```bash
HMAC_SECRET_KEY=your-secret-key-here
PORT=8000
HOST=0.0.0.0
```

### Installation

```bash
pip install fastapi uvicorn pydantic python-multipart
```

### Start Server

```bash
uvicorn api.main:app --host 0.0.0.0 --port 8000
```

### Run Tests

```bash
# Import the Postman collection for comprehensive testing
# See Nyaya_AI_Backend.postman_collection.json
```

### Import Postman

The Postman collection includes all endpoints with sample payloads and headers.

## 🤝 Handover Notes

### What Aditya Plugs Into

- **Data Bridge**: Load legal datasets into the system
- **Agent Logic**: Implement domain-specific legal reasoning
- **Event System**: Integrate with the provenance chain

### What Hrujul Consumes

- **API Endpoints**: All documented endpoints for frontend integration
- **Response Formats**: Standardized response schemas
- **Trace System**: Audit trail for transparency

### What Future Engineers Must NOT Break

- **Sovereign Compliance**: Never remove event signing or hash chaining
- **Provenance Chain**: Maintain immutable audit trail
- **Advisory contract**: Preserve `recommendation.type` semantics — do not reintroduce `enforcement_decision` or content blocking
- **Trace continuity**: Middleware `trace_id` must propagate through the full query pipeline
- **API Contracts**: Keep `final_decision_contract.json` v2.0.0 / `tantra_v3` alignment
- **Data Bridge**: Preserve original JSON files, only normalize
- **Security**: Never bypass nonce validation or signature verification

## 📊 System Validation

The system has been validated to ensure:

- ✅ All endpoints respond correctly
- ✅ No runtime crashes in basic functionality
- ✅ Provenance chain validates correctly
- ✅ Trace retrieval works as expected
- ✅ RL feedback emits events properly
- ✅ Advisory recommendation model (no enforcement gating)
- ✅ Convergence test suite passes (`test_tantra_convergence.py` — 6/6)
- ✅ Provenance and output bucket logging with cryptographic proof
- ✅ Clean folder structure maintained
- ✅ No code duplication
- ✅ No unnecessary changes made

---

*This system is designed for sovereign compliance and transparent legal intelligence processing across multiple jurisdictions.*