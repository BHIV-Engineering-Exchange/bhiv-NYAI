# REVIEW PACKET — Phase VI Live Tantra Runtime Integration

**Sprint:** Live Tantra Runtime Integration (NYAI Phase VI)  
**Date:** 2026-07-07  
**Owner:** Shashank

## Executive summary

NYAI is wired as a **gated, feature-flagged** participant in the BHIV Tantra ecosystem. All integrations default **disabled** — a clean checkout behaves identically to Phase V.

### Shipped (5 of 5 integrations)

1. **Bucket** — producer client, outbox pattern, `/ecosystem/bucket/health`
2. **BHIV Core** — X-Trace-Id middleware, registry-only client, proposed registry entry (not merged)
3. **InsightFlow** — fail-open dataset publisher with local JSONL fallback
4. **Vedant (knowledge/graph read scope)** — `ECOSYSTEM_READ_API_KEY` for GET `/knowledge/*`, `/graph/*`
5. **CLO** — read-only client, `/ecosystem/clo/health` check, gated to Shakti infrastructure (disabled by default)
6. **SAMACHAR (SVACS)** — Vision Intelligence webhook listener, change signal event mapping, `/ecosystem/samachar/health` check

## Test evidence

```
158 passed (pytest tests/ --ignore=tests/test_faiss_search.py)
```

## Human decisions required before production enablement

- [ ] Bucket Writer Authority Matrix: add NYAI (`nyai.*` source_module_id)
- [ ] Raj: registry-only vs `/execute_task` orchestration (Section 3.4)
- [ ] Vijay: rotate InsightFlow API key; confirm durable endpoint
- [ ] Merge `proposed_nyai_registry_entry.json` into Core's `TANTRA_INTEGRATION_REGISTRY.json`

## Do NOT enable without approval

- `BUCKET_PRODUCER_ENABLED=true` in shared environments
- `BHIV_CORE_ENABLED=true`
- `INSIGHTFLOW_ENABLED=true`
