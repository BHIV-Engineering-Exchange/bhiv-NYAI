import os
import json
from typing import Dict, Any, List, Optional
import logging

logger = logging.getLogger(__name__)

JURISDICTIONS_DIR = os.path.join(os.path.dirname(__file__), '..', 'data', 'jurisdictions')

STOPWORDS = {
    'and', 'the', 'with', 'for', 'after', 'from', 'that', 'this', 'into', 'without',
    'where', 'years', 'year', 'under', 'before', 'between', 'during', 'about', 'over',
    'such', 'their', 'which', 'will', 'have', 'been', 'each', 'other', 'them', 'they',
    'what', 'when', 'some', 'than', 'then', 'also', 'just', 'does', 'did', 'was', 'were'
}

class MultiJurisdictionDatabaseManager:
    """
    Multi-Jurisdiction Database Engine for Nyaya AI.
    Manages isolated legal statutory databases for India, UAE, and UK.
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
                        num_stat = len(data.get('statutes', []))
                        logger.info(f"Loaded {num_stat} statutes for jurisdiction: {jurisdiction_name}")
                except Exception as e:
                    logger.error(f"Error loading jurisdiction data for {code}: {e}")

    def normalize_jurisdiction(self, jurisdiction: Optional[str]) -> str:
        if not jurisdiction:
            return "india"
        j_lower = jurisdiction.strip().lower()
        if any(term in j_lower for term in ["uae", "dubai", "emirates", "abu dhabi", "ae"]):
            return "uae"
        if any(term in j_lower for term in ["uk", "london", "england", "britain", "gb", "scotland", "wales", "manchester"]):
            return "uk"
        return "india"

    def detect_jurisdiction_from_text(self, text: str) -> str:
        """Auto-detects jurisdiction from query text if not explicitly passed."""
        if not text:
            return "India"
        t_lower = text.lower()
        if any(term in t_lower for term in ["dubai", "abu dhabi", "uae", "mohre", "emirates", "dirham", "aed"]):
            return "UAE"
        if any(term in t_lower for term in ["london", "uk", "england", "manchester", "theft act", "companies act", "crown court"]):
            return "UK"
        return "India"

    def get_statutes(self, jurisdiction: str) -> List[Dict[str, Any]]:
        norm_j = self.normalize_jurisdiction(jurisdiction)
        db = self._databases.get(norm_j, {})
        return db.get("statutes", [])

    def search_statutes(self, query: str, jurisdiction: Optional[str] = None) -> Dict[str, Any]:
        """Searches legal sections strictly isolated within the target jurisdiction."""
        target_j = jurisdiction or self.detect_jurisdiction_from_text(query)
        norm_j = self.normalize_jurisdiction(target_j)
        statutes = self.get_statutes(norm_j)

        q_terms = [t for t in query.lower().split() if len(t) > 2 and t not in STOPWORDS]
        matches = []

        for st in statutes:
            score = 0
            text_to_search = f"{st.get('title', '')} {st.get('description', '')} {st.get('act_name', '')} {st.get('section', '')}".lower()
            for term in q_terms:
                if term in text_to_search:
                    score += 2
            
            # Phrase bonuses for strong relevance
            for bigram_len in [2, 3]:
                for i in range(len(q_terms) - bigram_len + 1):
                    phrase = ' '.join(q_terms[i:i+bigram_len])
                    if phrase in text_to_search:
                        score += 5

            if score >= 2:
                matches.append({**st, "relevance_score": score})

        matches.sort(key=lambda x: x.get("relevance_score", 0), reverse=True)
        top_score = matches[0]["relevance_score"] if matches else 0
        filtered_matches = [m for m in matches if m.get("relevance_score", 0) >= max(2, top_score - 2)]

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
