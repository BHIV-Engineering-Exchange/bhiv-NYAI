# 🏛️ NYAI (Nyaya AI) - UI Performance, Classification & Team Handover Report

**Date**: September 17, 2026  
**Author**: Ashwini  
**Repository**: https://github.com/BHIV-Engineering-Exchange/bhiv-NYAI  
**Target Collaborators**: Raj, Ranjit, Vednath Chaudhary, Rahil, Rhugved  

---

## 📌 Executive Summary

This report documents the major UI performance optimizations, legal query classification enhancements, and user-friendliness improvements implemented in **NYAI (Nyaya AI)**. 

All modifications have been verified in live browser environments with zero console errors, smooth 30 FPS background rendering, and clean user-focused UI layouts.

---

## 🚀 Key Improvements & Architectural Changes

### 1. WebGL Shader Performance & Lag Elimination (Galaxy.jsx)
- **Problem**: The 3D WebGL Starfield shader (Galaxy.jsx) ran unthrottled 60+ FPS calculations on full resolution, causing GPU spikes, browser tab freezes, and input lag.
- **Fix Implemented**:
  - **30 FPS Throttling**: Capped requestAnimationFrame loop to 30 FPS.
  - **Hardware DPR Cap**: Capped Device Pixel Ratio (dpr max 1.25) to eliminate 4K rendering overhead.
  - **Tab Visibility Auto-Pause**: Added document.hidden check to pause rendering when the user switches tabs or minimizes the window.
  - **React.memo Wrapping**: Wrapped GalaxyComponent in React.memo to prevent redundant WebGL scene rebuilds on parent state changes.
  - **Density Tuning**: Reduced particle density from 1.5 to 0.8 in App.jsx and AuthPage.jsx for optimal visuals with 50% less GPU memory usage.

### 2. Criminal Domain Classifier Expansion (query_understanding.py)
- **Problem**: Queries containing sexual offence terms or typos (e.g. rap, rapist, molestation, punishment) were incorrectly fallback-classified into civil domain, returning inappropriate Civil Procedure Code (CPC) sections.
- **Fix Implemented**:
  - Expanded the keyword list in backend/services/query_understanding.py to include rape, rapist, raping, rap, theft, assault, murder, robbery, fir, arrest, crime, punishment, penalty, jail, imprisonment, bail, offense, offence, pocso, posh, molestation, harassment, ipc, bns, crpc, bnss.
  - Sexual offences and assault queries now correctly route to domain: criminal, matching IPC Section 376 / BNS Section 64 penal provisions.

### 3. User-Friendly UI Transformation (LegalQueryCard.jsx)
- **Problem**: Non-technical users were overwhelmed by developer-focused debug logs (Processing Route, Trace ID, raw % breakdowns) displayed directly on answer screens.
- **Fix Implemented**:
  - Encapsulated all technical pipeline logs, trace IDs, and raw confidence breakdowns inside a collapsible '🛠️ Show Developer / Pipeline Details' toggle button.
  - Non-technical users now see a clean, readable view containing only:
    1. Legal Analysis
    2. Applicable Statutes
    3. Available Remedies
    4. Procedural Steps

---

## 🛠️ Developer & Team Execution Guide

### How to Run NYAI Locally

#### 1. Backend Server (FastAPI)
cd C:\Users\pc\Desktop\BHIV_ASHWINI\NYAI\bhiv-NYAI\backend
python -m uvicorn api.main:app --host 127.0.0.1 --port 8000 --reload

*Access API Swagger UI at http://localhost:8000/docs.*

#### 2. Frontend Application (React + Vite)
cd C:\Users\pc\Desktop\BHIV_ASHWINI\NYAI\bhiv-NYAI\frontend
npm run dev

*Access NYAI web application at http://localhost:3000.*

---

## 🗺️ Next Steps for Team (Raj, Ranjit, Vednath Chaudhary, Rahil, Rhugved)

1. **Tenanted Auth Integration (tenant_id, org_id)**:
   - Mirror MITRA's multi-tenant isolation pattern by injecting X-Tenant-ID and X-Org-ID headers into frontend/src/services/nyayaApi.js and validating tenant_id scopes in FastAPI dependencies.
2. **Mobile Viewport Optimization**:
   - Ensure GlassSurface.jsx and table views adjust seamlessly on screen widths below 768px.

---
