import os
import json
import logging
from typing import Dict, Any, List, Optional
from datetime import datetime, timezone

logger = logging.getLogger(__name__)

class PGVectorDatabaseManager:
    """
    PostgreSQL + PGVector Database Engine for Nyaya AI.
    Handles persistent multi-jurisdiction legal statutory storage and vector search.
    """

    def __init__(self):
        self.db_uri = os.getenv("DATABASE_URL") or os.getenv("POSTGRES_URI", "postgresql://postgres:postgres@localhost:5432/nyai_db")
        self.is_connected = False
        self._init_client()

    def _init_client(self):
        try:
            import psycopg2
            self.conn = psycopg2.connect(self.db_uri)
            self.is_connected = True
            logger.info("Connected to PostgreSQL + PGVector database!")
        except Exception as e:
            self.is_connected = False
            logger.info(f"PostgreSQL connection notice (using local multi-jurisdiction storage): {e}")

    def search_vector_statutes(self, query: str, jurisdiction: str, embedding_vector: Optional[List[float]] = None) -> List[Dict[str, Any]]:
        """
        Performs vector similarity search in PostgreSQL + PGVector database.
        Query: SELECT * FROM jurisdiction_statutes WHERE jurisdiction = %s ORDER BY embedding <=> %s LIMIT 5;
        """
        if not self.is_connected or not embedding_vector:
            from legal_database.multi_jurisdiction_db import multi_jurisdiction_db
            res = multi_jurisdiction_db.search_statutes(query=query, jurisdiction=jurisdiction)
            return res.get("statutes", [])

        try:
            import psycopg2
            with self.conn.cursor() as cur:
                vector_str = f"[{','.join(map(str, embedding_vector))}]"
                sql = """
                    SELECT id, jurisdiction, country_code, act_name, section, title, description, penalty, domain,
                           1 - (embedding <=> %s::vector) AS similarity_score
                    FROM jurisdiction_statutes
                    WHERE LOWER(jurisdiction) = LOWER(%s)
                    ORDER BY embedding <=> %s::vector ASC
                    LIMIT 5;
                """
                cur.execute(sql, (vector_str, jurisdiction, vector_str))
                rows = cur.fetchall()
                results = []
                for r in rows:
                    results.append({
                        "id": r[0],
                        "jurisdiction": r[1],
                        "country_code": r[2],
                        "act_name": r[3],
                        "section": r[4],
                        "title": r[5],
                        "description": r[6],
                        "penalty": r[7],
                        "domain": r[8],
                        "similarity_score": float(r[9]) if r[9] else 0.95
                    })
                return results
        except Exception as e:
            logger.warning(f"PGVector search fallback: {e}")
            from legal_database.multi_jurisdiction_db import multi_jurisdiction_db
            res = multi_jurisdiction_db.search_statutes(query=query, jurisdiction=jurisdiction)
            return res.get("statutes", [])

    def log_user_query(self, user_id: str, query: str, jurisdiction: str, matched_sections: List[Dict[str, Any]], trace_id: Optional[str] = None):
        """Logs user query telemetry to PostgreSQL table `user_search_logs`."""
        if not self.is_connected:
            return
        try:
            with self.conn.cursor() as cur:
                sql = """
                    INSERT INTO user_search_logs (user_id, query, jurisdiction, matched_sections, trace_id)
                    VALUES (%s, %s, %s, %s, %s);
                """
                cur.execute(sql, (user_id, query, jurisdiction, json.dumps(matched_sections), trace_id or "auto"))
                self.conn.commit()
        except Exception as e:
            logger.warning(f"User query logging warning: {e}")

pgvector_db = PGVectorDatabaseManager()
