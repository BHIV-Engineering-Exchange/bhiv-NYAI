# Phase VI Enablement Checklist

**Status:** In progress. Several external prerequisites remain open.

Use this checklist to turn on ecosystem integrations in staging/production.  
Do **not** commit real secrets to git — set values only in `backend/.env` (local) or your deployment dashboard (Render).

---

## Step 1 — Confirm NYAI public URL

Set the deployed NYAI base URL (used in Core registry):

```
https://nyai-backend-n9h8.onrender.com
```

If your live URL is different, use that instead everywhere below.

**Update file:** `backend/ecosystem/proposed_nyai_registry_entry.json` → set `entry.nyai.url`.

---

## Step 2 — Merge NYAI into BHIV Core registry (Raj)

Raj merges the approved entry from:

`backend/ecosystem/proposed_nyai_registry_entry.json`

into:

`BHIV-Core-TANTRA-Sutradhar/TANTRA_INTEGRATION_REGISTRY.json`

**Confirmed model:** registry-only participation (NYAI does **not** call `/execute_task`).

---

## Step 3 — Set production environment variables (Render / platform)

Paste into **Render → NYAI backend → Environment** (or `backend/.env` locally):

```bash
# Bucket (Siddhesh — approved)
BUCKET_ENDPOINT=https://bhiv-bucket-i1l6.onrender.com
BUCKET_PRODUCER_ENABLED=true

# BHIV Core (Raj — approved, registry-only)
BHIV_CORE_ENDPOINT=<confirmed-core-url>
BHIV_CORE_ENABLED=true

# InsightFlow (Vijay — endpoint confirmed; key must be stored only in secrets)
INSIGHTFLOW_ENDPOINT=https://bhiv-mdu-api.onrender.com
INSIGHTFLOW_API_KEY=<rotated-key-from-secrets-manager>
INSIGHTFLOW_ENABLED=true

# CLO (Ansh — CLO API is served directly by deployed SHAKTI)
CLO_ENDPOINT=https://shakti-gc-infra.onrender.com
# No CLO_API_KEY is required by the current deployment; leave unset/empty.
CLO_ENABLED=false
CLO_SYNC_ENABLED=false

# Vedant read access (you generate)
ECOSYSTEM_READ_API_KEY=<generate-see-step-4>
```

Keep existing required NYAI vars set (`NYAI_API_KEY`, `GROQ_API_KEY`, `FRONTEND_URL`, etc.).

---

## Step 4 — Generate Vedant read key

Run once locally:

```bash
python -c "import secrets; print(secrets.token_urlsafe(32))"
```

Use the output as `ECOSYSTEM_READ_API_KEY`. Share it with Vedant out-of-band.

**Scope:** `GET /knowledge/*` and `GET /graph/*` only.

---

## Step 5 — Bucket governance record / static approval evidence

Record approval on Bucket or attach Siddhesh/static-product approval evidence:

Attempted on 2026-07-08. Actual responses returned validation errors:

- `query -> integration_id: Field required`
- `query -> integration_type: Field required`
- `detail: data_schema required`

Follow-up received: the validation endpoint appears to be static and only selected products are approved, so it may not be the right generic endpoint for NYAI. If Siddhesh confirms NYAI approval through a static product list or another artifact, attach that evidence here instead of blocking on this route.

---

## Step 6 — Deploy and restart

1. Save environment variables on Render.
2. Trigger redeploy (or restart local server).
3. Confirm startup logs show no auth/config errors.

---

## Step 7 — Verify (must pass before go-live)

```bash
cd backend
python -m pytest tests/ --ignore=tests/test_faiss_search.py -q
```

Against running backend:

```bash
curl https://nyai-backend-n9h8.onrender.com/health/ready
curl https://nyai-backend-n9h8.onrender.com/ecosystem/bucket/health
```

Send one test legal query and confirm:

- Response includes `X-Trace-Id`
- Evidence appears locally (outbox) and in Bucket when reachable
- `/nyaya/trace/{trace_id}` replay works

Test Vedant read access:

```bash
curl -H "X-API-Key: <ECOSYSTEM_READ_API_KEY>" \
  https://nyai-backend-n9h8.onrender.com/knowledge/health
```

---

## Step 8 — Hand off to Vedant

Send Vedant:

- Base URL: `https://nyai-backend-n9h8.onrender.com`
- API key: `ECOSYSTEM_READ_API_KEY`
- Allowed routes: `GET /knowledge/*`, `GET /graph/*`
- Doc: `Live Tantra Runtime Integration (NYAI__ Phase VI)/Ecosystem_Access_Scopes.md`

---

## Still deferred / externally blocked

| Item | Owner | Action |
|------|-------|--------|
| GC-Shakti broader process | Ansh | CLO API is live via direct provider; broader GC-Shakti integration process has started but is not complete |
| SAMACHAR integration | — | Add repo/contract to workspace first |
| Bucket write-path auth | Siddhesh | Bucket-side hardening (tracked in known_gaps) |
| InsightFlow enablement | Vijay + NYAI | Store the provided key only in secrets, then verify `/ecosystem/insightflow/health` before enabling |

---

## Done when

- [ ] Registry entry merged in Core repo
- [ ] Bucket governance validation returns recorded approval
- [ ] Production ecosystem flags enabled only after credentials/endpoints verified
- [ ] `ECOSYSTEM_READ_API_KEY` generated and shared with Vedant
- [ ] Pytest suite passes
- [ ] `/health/ready`, `/ecosystem/bucket/health`, `/ecosystem/clo/health` verified
- [ ] End-to-end query + trace replay verified
