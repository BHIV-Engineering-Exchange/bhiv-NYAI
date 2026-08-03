# Ecosystem Access Scopes (Phase VI — Vedant)

External consumers (Vedant / Knowledge Repository + Graph Runtime) receive **read-only** access to NYAI Phase V APIs.

## Scope

| Method | Path | Key |
|--------|------|-----|
| `GET` | `/knowledge/*` | `ECOSYSTEM_READ_API_KEY` |
| `GET` | `/graph/*` | `ECOSYSTEM_READ_API_KEY` |

All other methods on those prefixes still require `NYAI_API_KEY`.

## Implementation

`backend/api/security.py` — `_is_ecosystem_read_path()` + `ECOSYSTEM_READ_API_KEY` validation via `hmac.compare_digest`.

## Provisioning

Generate `ECOSYSTEM_READ_API_KEY` when Vedant's access is provisioned. Do not commit the live value.

## Boundary

CLO remains canonical knowledge owner when available. This scope exposes NYAI's **own** governed repository only — no CLO overlap.
