# Integration Summary — Phase VI

## Detection matrix (verified in workspace)

| Integration | Folder | Built |
|-------------|--------|-------|
| Bucket | `bucket/` ✅ | Yes |
| BHIV Core | `BHIV-Core-TANTRA-Sutradhar/` ✅ | Yes (registry-only) |
| InsightFlow | No dedicated folder ❌ | Yes (contract via Core registry) |
| Vedant (NYAI APIs) | `backend/knowledge/`, `backend/api/graph_router.py` ✅ | Yes (read scope) |
| CLO | `Shakti-GC-Infra/` ✅ | Yes (read-only, disabled by default) |
| SAMACHAR | Absent ❌ | **Skipped** (integration deferred) |

## Runtime flow (when flags enabled)

```
User → NYAI /nyaya/query
  → Knowledge retrieval + legal reasoning
  → Local output_logs (outbox)
  → Bucket POST /bucket/artifact (retry on lineage conflict)
  → InsightFlow POST /api/v1/datasets/ (fail-open)
  → Replay via /nyaya/trace/{trace_id}
```

## Feature flags

| Flag | Default in repo | Production (after enablement) |
|------|-----------------|-------------------------------|
| `BUCKET_PRODUCER_ENABLED` | `false` | `true` |
| `BHIV_CORE_ENABLED` | `false` | `true` |
| `INSIGHTFLOW_ENABLED` | `false` | `true` |

Enablement guide: [enablement_checklist.md](enablement_checklist.md)

## Docs-vs-code mismatches logged

See [known_gaps.md](known_gaps.md).
