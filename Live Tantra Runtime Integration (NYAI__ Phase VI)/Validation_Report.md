# NYAI Validation Report

**Date:** 06-08-2026
**Tester:** Ranjit Patil

---

## Objective

Validate the latest NYAI build after integration updates and verify reported fixes.

---

## Environment

- Frontend: Local (Vite)
- Backend: FastAPI (Uvicorn)
- Branch: ranjit/nyai-validation
- Latest updates pulled from main before validation.

---

# Test Cases

## Test 1 – India Consumer Query

Query:
> I purchased a refrigerator online, but it stopped working within a week and the seller refused to replace it. What legal remedies do I have in India?

Result:
- PASS

Validated:
- Jurisdiction detection
- Consumer domain detection
- Statute retrieval
- Procedural steps
- Confidence score
- Trace ID generation

---

## Test 2 – UAE Property Query

Query:
> My landlord increased my rent without proper notice. Is this legal in the UAE?

Result:
- PASS

Validated:
- UAE jurisdiction detection
- Property domain detection
- Applicable statutes
- Remedies
- Procedural steps
- Trace ID generation

---

## Test 3 – UK Labour Query

Query:
> My employer dismissed me without following a disciplinary process. What legal remedies do I have in the UK?

Initial Observation:

Available Remedies contained criminal remedies that were unrelated to employment.

Status:
Reported to Shashank.

---

## Retest

Latest commit pulled from main.

Re-tested same query.

Result:
PASS

Available Remedies correctly display employment-related remedies including:

- Reinstatement
- Re-engagement
- Compensation
- Basic Award
- Discrimination-related remedies

Issue verified as resolved.

---

## Additional Validation

Verified:

- Frontend startup
- Backend startup
- API connectivity
- Legal decision generation
- Multi-jurisdiction support
- Trace ID generation

---

## Known Observation

InsightFlow dataset registration logs may return HTTP 401 during local development due to API key/environment differences.

This did not affect legal query generation.

---

# Overall Result

Overall Status:

PASS

Core legal query functionality validated successfully across:

- India
- UAE
- UK

Reported issue was fixed and verified successfully.
