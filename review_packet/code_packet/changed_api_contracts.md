# Changed API Contracts — Phase VI

## New endpoints (no auth)

| Method | Path | Response |
|--------|------|----------|
| GET | `/ecosystem/bucket/health` | `{status: DISABLED\|PASS\|DEGRADED}` |
| GET | `/ecosystem/bhiv-core/health` | `{status: DISABLED\|PASS\|DEGRADED}` |
| GET | `/ecosystem/insightflow/health` | `{status: DISABLED\|PASS\|DEGRADED}` |
| GET | `/ecosystem/samachar/health` (alias `/ecosystem/svacs/health`) | `{status: DISABLED\|PASS\|DEGRADED}` |
| POST | `/ecosystem/samachar/event` (alias `/ecosystem/svacs/event`) | Webhook event receiver triggering CLO sync |

## Modified behavior

| Area | Change |
|------|--------|
| All responses | `X-Trace-Id` header echoed; incoming header preserved |
| `GET /health/ready` | Adds `bucket_producer`, `bhiv_core`, `insightflow`, `samachar` dependency blocks |
| `GET /knowledge/*`, `GET /graph/*` | Accept `ECOSYSTEM_READ_API_KEY` as alternative to `NYAI_API_KEY` |

## External contracts consumed (when enabled)

| Service | Endpoint |
|---------|----------|
| Bucket | `POST /bucket/artifact`, `GET /bucket/chain-state`, `GET /bucket/artifact/{id}` |
| InsightFlow | `POST /api/v1/datasets/` |
| BHIV Core | `GET /health` only |
| SAMACHAR / SVACS | `GET /health` only |

