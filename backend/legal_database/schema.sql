-- PostgreSQL + PGVector Database Schema for Nyaya AI (NYAI)
-- Multi-Jurisdiction Legal statutory database & search telemetry logs

-- 1. Enable PGVector Extension for Semantic Search
CREATE EXTENSION IF NOT EXISTS vector;

-- 2. Create Statutory Database Table with Vector Embeddings Column
CREATE TABLE IF NOT EXISTS jurisdiction_statutes (
    id VARCHAR(100) PRIMARY KEY,
    jurisdiction VARCHAR(50) NOT NULL, -- 'India' | 'UAE' | 'UK'
    country_code VARCHAR(10) NOT NULL, -- 'IN' | 'AE' | 'GB'
    legal_system VARCHAR(100),
    act_name VARCHAR(255) NOT NULL,
    section VARCHAR(100) NOT NULL,
    title VARCHAR(255) NOT NULL,
    description TEXT NOT NULL,
    penalty TEXT,
    domain VARCHAR(100),
    court_type VARCHAR(150),
    replaced_legacy_ipc VARCHAR(150),
    embedding vector(384), -- 384-dimensional sentence transformer embeddings
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 3. Create Index on Jurisdiction and Vector Cosine Distance
CREATE INDEX IF NOT EXISTS idx_statutes_jurisdiction ON jurisdiction_statutes(jurisdiction);
CREATE INDEX IF NOT EXISTS idx_statutes_embedding ON jurisdiction_statutes USING ivfflat (embedding vector_cosine_ops) WITH (lists = 100);

-- 4. Create User Search Telemetry Logs Table
CREATE TABLE IF NOT EXISTS user_search_logs (
    id SERIAL PRIMARY KEY,
    user_id VARCHAR(100) NOT NULL,
    query TEXT NOT NULL,
    jurisdiction VARCHAR(50) NOT NULL,
    matched_sections JSONB,
    trace_id VARCHAR(100),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);
