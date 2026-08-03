# Handover — Phase VI

**Status:** Collaborator approvals received. Ready for enablement.

Follow the step-by-step checklist: [enablement_checklist.md](enablement_checklist.md)

---

## Enablement sequence

### 1. Bucket (Siddhesh — approved)

```bash
BUCKET_ENDPOINT=https://bhiv-bucket-i1l6.onrender.com
BUCKET_PRODUCER_ENABLED=true
```

Optional one-time governance record: `POST /governance/gate/validate-integration` on Bucket.

### 2. BHIV Core (Raj — approved, registry-only)

```bash
BHIV_CORE_ENDPOINT=<confirmed-core-url>
BHIV_CORE_ENABLED=true
```

Merge `backend/ecosystem/proposed_nyai_registry_entry.json` into Core's `TANTRA_INTEGRATION_REGISTRY.json`.  
**Confirmed:** NYAI participates registry-only; does not call `/execute_task`.

### 3. InsightFlow (Vijay — approved)

```bash
INSIGHTFLOW_ENDPOINT=<confirmed-stable-url>
INSIGHTFLOW_API_KEY=<rotated-key-from-secrets-manager>
INSIGHTFLOW_ENABLED=true
```

### 4. Vedant read access

```bash
ECOSYSTEM_READ_API_KEY=<generate-with-secrets.token_urlsafe(32)>
```

Share key with Vedant for `GET /knowledge/*` and `GET /graph/*`.

### 5. Samachar / SVACS (vessel detection change signal receiver)

```bash
SAMACHAR_ENDPOINT=https://bhiv-svacs.onrender.com
SAMACHAR_ENABLED=true
```

---

## Verification commands

```bash
cd backend
python -m pytest tests/ --ignore=tests/test_faiss_search.py -q
curl https://nyai-backend-n9h8.onrender.com/health/ready
curl https://nyai-backend-n9h8.onrender.com/ecosystem/bucket/health
curl https://nyai-backend-n9h8.onrender.com/ecosystem/samachar/health
```

---

## Contacts

| Integration | Owner | Status |
|-------------|-------|--------|
| Bucket governance | Siddhesh | ✅ Approved — enable producer |
| Core registry | Raj | ✅ Approved — merge registry entry (registry-only) |
| InsightFlow | Vijay | ✅ Approved — use rotated key + stable URL |
| Vedant read access | NYAI + Vedant | ⏳ Generate and share `ECOSYSTEM_READ_API_KEY` |
| CLO | Ansh | ✅ Scaffolded — read-only client, disabled by default |
| SAMACHAR | NYAI | ✅ Fully integrated with SVACS, webhook listener ready |
