# 🏛️ Nyaya AI (NYAI) — Sovereign Legal Intelligence Platform

Nyaya AI (NYAI) is a sovereign-compliant multi-agent legal intelligence platform providing auditable, transparent, advisory-only legal reasoning across India, UK, UAE, and KSA, built on the **TANTRA v3** governance contract.

> **All canonical documentation lives in [`docs/`](docs/README.md).** This README is only an entry point.

## 📚 Documentation Hub

| Guide | Purpose |
|---|---|
| [docs/README.md](docs/README.md) | Documentation hub — start here |
| [docs/SETUP.md](docs/SETUP.md) | Install, configure, run locally |
| [docs/API_REFERENCE.md](docs/API_REFERENCE.md) | 80-endpoint API reference, auth, status codes |
| [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md) | System design and request lifecycle |
| [docs/ENVIRONMENT_VARIABLES.md](docs/ENVIRONMENT_VARIABLES.md) | Code-verified configuration registry |
| [docs/TESTING.md](docs/TESTING.md) | How to run every test suite |
| [docs/DEPLOYMENT.md](docs/DEPLOYMENT.md) | A–Z deployment & operations manual |
| [docs/DOCUMENTATION_INDEX.md](docs/DOCUMENTATION_INDEX.md) | Map of every module and file |
| [docs/ARCHIVE.md](docs/ARCHIVE.md) | Obsolete/superseded docs registry |
| [docs/validation/VALIDATION_REPORT.md](docs/validation/VALIDATION_REPORT.md) | 2026-08-17 validation evidence |

## 🚀 Quick Start

```bash
# Backend (localhost:8000) — docs at /docs, /redoc, /health
cd backend
start_backend.bat          # or: python -m uvicorn api.main:app --host 0.0.0.0 --port 8000 --reload

# Frontend (localhost:3000)
cd frontend
npm install && npm run dev
```

## 📦 Repository Layout

```
README.md                   ← this entry point
docs/                       ← ALL canonical documentation
backend/                    ← Python FastAPI backend
frontend/                   ← React + Vite frontend
final_decision_contract.json ← TANTRA v3 contract
```

See [docs/DOCUMENTATION_INDEX.md](docs/DOCUMENTATION_INDEX.md) for the full file map.
