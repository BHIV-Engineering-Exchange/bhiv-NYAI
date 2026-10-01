import os
import json
from typing import Dict, Any, List, Optional
import logging

logger = logging.getLogger(__name__)

JURISDICTIONS_DIR = os.path.join(os.path.dirname(__file__), '..', 'data', 'jurisdictions')

class MultiJurisdictionDatabaseManager:
    """
    Multi-Jurisdiction Database Engine for Nyaya AI.
    Manages isolated legal statutory databases for India 🇮🇳, UAE 🇦🇪, and UK 🇬🇧.
    """

    def __init__(self):
        self._databases: Dict[str, Dict[str, Any]] = {}
        self.load_all_jurisdictions()

    def load_all_jurisdictions(self):
        """Loads statutory databases for India, UAE, and UK into memory."""
        for code in ['india', 'uae', 'uk']:
            file_path = os.path.join(JURISDICTIONS_DIR, code, 'statutes.json')
            if os.path.exists(file_path):
                try:
                    with open(file_path, 'r', encoding='utf-8') as f:
                        data = json.load(f)
                        jurisdiction_name = data.get('jurisdiction', code.capitalize())
                        self._databases[jurisdiction_name.lower()] = data
                        logger.info(f"Loaded {len(data.get('statutes', []))} statutes for jurisdiction: {jurisdiction_name}")
                except Exception as e:
                    logger.error(f"Error loading jurisdiction data for {code}: {e}")

    def normalize_jurisdiction(self, jurisdiction: Optional[str]) -> str:
        if not jurisdiction:
            return "india"
        j_lower = jurisdiction.strip().lower()
        if "uae" in j_lower or "dubai" in j_lower or "emirates" in j_lower or "ae" == j_lower:
            return "uae"
        if "uk" in j_lower or "london" in j_lower or "england" in j_lower or "gb" == j_lower:
            return "uk"
        return "india"

    def detect_jurisdiction_from_text(self, text: str) -> str:
        """Auto-detects jurisdiction from query text if not explicitly passed."""
        if not text:
            return "India"
        t_lower = text.lower()
        if any(term in t_lower for term in ["dubai", "abu dhabi", "uae", "mohre", "article 435", "article 117"]):
            return "UAE"
        if any(term in t_lower for term in ["london", "uk", "england", "theft act 1968", "companies act 2006", "chancery"]):
            return "UK"
        return "India"

    def get_statutes(self, jurisdiction: str) -> List[Dict[str, Any]]:
        norm_j = self.normalize_jurisdiction(jurisdiction)
        db = self._databases.get(norm_j, {})
        return db.get("statutes", [])

    def search_statutes(self, query: str, jurisdiction: Optional[str] = None) -> Dict[str, Any]:
        """Searches legal sections isolated within the target jurisdiction."""
        target_j = jurisdiction or self.detect_jurisdiction_from_text(query)
        norm_j = self.normalize_jurisdiction(target_j)
        statutes = self.get_statutes(norm_j)

        q_terms = [t for t in query.lower().split() if len(t) > 2]
        matches = []

        for st in statutes:
            score = 0
            text_to_search = f"{st.get('title', '')} {st.get('description', '')} {st.get('act_name', '')} {st.get('section', '')}".lower()
            for term in q_terms:
                if term in text_to_search:
                    score += 1
            if score > 0:
                matches.append({**st, "relevance_score": score})

        matches.sort(key=lambda x: x.get("relevance_score", 0), reverse=True)
        top_score = matches[0]["relevance_score"] if matches else 0
        filtered_matches = [m for m in matches if m.get("relevance_score", 0) >= max(1, top_score - 1)]

        db_meta = self._databases.get(norm_j, {})
        return {
            "jurisdiction": db_meta.get("jurisdiction", norm_j.upper()),
            "country_code": db_meta.get("country_code", "IN"),
            "legal_system": db_meta.get("legal_system", "Statutory Code"),
            "query": query,
            "total_matches": len(filtered_matches),
            "statutes": filtered_matches[:5]
        }

multi_jurisdiction_db = MultiJurisdictionDatabaseManager()

# Reload trigger: 1790846010.5213964

# Reload trigger: 1790846199.187317

# Reload trigger: 1790846328.4835713

# Reload trigger: 1790846404.7180424
