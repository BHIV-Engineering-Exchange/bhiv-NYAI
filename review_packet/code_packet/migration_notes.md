# Migration Notes — Phase VI

## Zero-impact default

No migration required for existing deployments. All Phase VI flags default to `false`.

## Optional enablement

1. Add commented env vars from `backend/.env.example` to deployment secrets.
2. Complete governance approvals (see `handover.md`).
3. Enable flags one at a time in staging.
4. Verify `/health/ready` and `/ecosystem/*/health`.

## Data

- Local evidence remains in `OUTPUT_DIRECTORY` / `output_logs/`.
- New outbox files created only on Bucket publish failure when producer is enabled.

## Rollback

Set all `*_ENABLED` flags to `false` — NYAI reverts to Phase V behavior immediately.
