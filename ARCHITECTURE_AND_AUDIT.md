# NYAI Platform: Architecture & System Audit Report

This document outlines the core architecture of the Nyaya AI (NYAI) platform, the origin of its database, the query resolution pipeline, and an audit of recent issues and their fixes. This can be used as a reference during technical demos.

---

## 1. Where is the Database Coming From?

NYAI does **not** use a traditional relational database (like MySQL or PostgreSQL) for its core legal knowledge. Instead, it uses an **In-Memory Hybrid Vector & Keyword Database** loaded from structured JSON files.

### Data Sources:
- **Statutes & Acts:** Stored in `backend/data/statutes.json`, `backend/db/` (e.g., `hindu_marriage_act_complete.json`, `juvenile_justice_act_2015.json`, etc.).
- **Case Laws:** Stored in `backend/data/caselaw/`.

### How Data is Indexed (The Search Engines):
When the backend starts, the `Data Bridge (loader.py)` reads these JSON files into memory and builds two search indexes:
1. **BM25 Index (Lexical/Keyword Search):** Looks for exact word matches (e.g., if you search "theft", it finds sections with the word "theft"). Powered by `rank-bm25`.
2. **FAISS Vector Index (Semantic Search):** Understands the "meaning" of a query. If you search "stealing a phone from a house", it understands this means "theft in a dwelling house" and pulls the correct sections even if the exact words don't match. Powered by `sentence-transformers` and `faiss-cpu`.

---

## 2. How the Project Works (System Architecture & Pipeline)

The platform operates on a **Retrieval-Augmented Generation (RAG) & Sovereign Agent architecture**. When a user submits a query from the React frontend, it hits the FastAPI backend and goes through the following pipeline:

1. **Query Understanding (Intent & Domain Detection):**
   - The system analyzes the query to determine the jurisdiction (e.g., India) and the legal domain (e.g., Criminal, Civil, Family).
   - It attempts to use an LLM (Groq API) for this. If the API is unavailable, it uses a **Local Fallback Classifier** based on keyword mapping.
2. **Hybrid Retrieval:**
   - The query is searched against both the BM25 Index and the FAISS Vector Index simultaneously to find candidate legal sections.
3. **Cross-Encoder Reranking:**
   - The candidate sections are scored and sorted by relevance.
4. **Legal Ontology System (`statute_resolver.py`):**
   - **CRITICAL STEP:** This system enforces legal logic. It prevents cross-law contamination (e.g., ensures Hindu Marriage Act doesn't show up in a Criminal query).
   - It also enforces **Penal Code Exclusivity**: If the system date is 2024 or later, it automatically blocks the old Indian Penal Code (IPC) and enforces the new **Bharatiya Nyaya Sanhita (BNS)**.
5. **Clean Legal Advisor:**
   - The finalized statutes, procedural steps, and confidence scores are packaged and sent back to the frontend UI.

---

## 3. System Audit: Why Were We Getting Wrong Answers?

During recent testing, the system returned incorrect domains (Civil instead of Criminal) and outdated laws (IPC instead of BNS). Here is the technical audit of why this happened and how it was fixed:

### Issue A: "Terrorist Attack" query classified as "Civil" Domain
* **Why it happened:** The system's primary LLM (Groq) was missing its API key, so it switched to the "Local Fallback Classifier" (`query_understanding.py`). This fallback script had a hardcoded list of keywords for the criminal domain (like murder, rape, theft), but words like "terrorist" and "cyber" were missing. Because it didn't recognize the words, it defaulted to the "Civil" domain, returning civil court procedural steps.
* **The Fix:** We updated `query_understanding.py` to include `"terrorist"`, `"terrorism"`, `"cyber"`, `"hack"`, and `"fraud"` in the criminal domain keywords.

### Issue B: "Theft" query returned old IPC Sections (378/379) instead of new BNS Sections (303/305)
* **Why it happened:** The system has a powerful **Ontology System** designed to automatically block IPC and return BNS for queries after 2024. However, inside `clean_legal_advisor.py`, there was a legacy hardcoded configuration called `QUERY_STATUTE_OVERRIDES`. This configuration stated: *"If the user types the word 'theft', ignore the database search and force-feed IPC 378 and 379."* This hardcoded override completely bypassed the intelligent ontology system.
* **The Fix:** We disabled the hardcoded `QUERY_STATUTE_OVERRIDES` in `clean_legal_advisor.py`. Now, the query flows properly into the dynamic database, where the Ontology System successfully detects the year (2026) and enforces the new BNS statutes.

### Issue C: Semantic Search was failing silently
* **Why it happened:** The FAISS Vector database requires specific Python packages to run. These were missing from the local environment, causing the system to silently disable "Hybrid Search" and rely only on basic keyword matching.
* **The Fix:** Installed `rank-bm25`, `sentence-transformers`, and `faiss-cpu` in the backend environment. The backend now successfully builds the hybrid vector indexes on startup.
