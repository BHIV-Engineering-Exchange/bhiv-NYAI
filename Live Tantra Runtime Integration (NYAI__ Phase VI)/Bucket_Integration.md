# Bucket Integration (Phase VI)

NYAI publishes constitutional evidence to Siddhesh's Bucket service using the **multi-producer** path verified against live code in `bucket/services/append_only_storage.py`.

## Endpoint

| Use | Endpoint |
|-----|----------|
| **Write (NYAI)** | `POST /bucket/artifact` |
| Do not use | `POST /bucket/artifacts/write` (Core-only boundary) |

## Envelope (code-authoritative)

Required fields: `artifact_id`, `trace_id`, `timestamp_utc`, `schema_version` (`1.0.0`), `source_module_id`, `artifact_type`, `payload`.

- Product identity: `source_module_id` dotted path (e.g. `nyai.legal_query`) — **not** `product_namespace` (not implemented server-side).
- `parent_hash`: from `GET /bucket/chain-state`; omit when `artifact_count == 0`.
- Lineage conflicts (`400` parent_hash mismatch): retry with refreshed chain state (concurrent writers).

## NYAI modules

| Module | Role |
|--------|------|
| `backend/ecosystem/bucket_producer.py` | HTTP client, post-write verification, outbox |
| `backend/tantra/output_bucket.py` | Local write-ahead outbox, forwards when enabled |
| `backend/evidence/storage_backend.py` | `BucketProducerBackend` for reads from local outbox |

## Environment

| Variable | Default | Notes |
|----------|---------|-------|
| `BUCKET_ENDPOINT` | `https://bhiv-bucket-i1l6.onrender.com` | Set explicitly for local dev |
| `BUCKET_PRODUCER_ENABLED` | `false` | **Do not enable in shared env until governance approval** |

## Failure mode

Fail-closed toward Bucket with local `bucket_outbox.jsonl` fallback. Local `output_logs/` remains authoritative for NYAI replay.

## Health

`GET /ecosystem/bucket/health` (gated; returns `DISABLED` when flag is off).
