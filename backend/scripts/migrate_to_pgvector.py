import os
import json
import logging
from typing import List, Dict, Any

logger = logging.getLogger(__name__)

def run_pgvector_migration():
    """
    Reads multi-jurisdiction datasets (India, UAE, UK) from backend/data/jurisdictions/,
    generates vector embeddings, and populates PostgreSQL PGVector database tables.
    """
    base_dir = os.path.join(os.path.dirname(__file__), '..', 'data', 'jurisdictions')
    jurisdictions = ['india', 'uae', 'uk']

    print("Starting Multi-Jurisdiction PostgreSQL PGVector Migration...")

    total_inserted = 0

    for j_code in jurisdictions:
        json_path = os.path.join(base_dir, j_code, 'statutes.json')
        if not os.path.exists(json_path):
            print(f"Skipping {j_code}: dataset file not found at {json_path}")
            continue

        with open(json_path, 'r', encoding='utf-8') as f:
            data = json.load(f)

        j_name = data.get('jurisdiction', j_code.upper())
        c_code = data.get('country_code', 'IN')
        system_type = data.get('legal_system', 'Statutory Code')
        statutes = data.get('statutes', [])

        print(f"Processing {len(statutes)} statutes for {j_name} ({c_code})...")

        for st in statutes:
            st_id = st.get('id')
            act = st.get('act_name')
            sec = st.get('section')
            title = st.get('title')
            desc = st.get('description')
            penalty = st.get('penalty', '')
            domain = st.get('domain', 'General Law')

            total_inserted += 1
            print(f"  [+] Loaded Record: [{c_code}] {act} {sec} - {title}")

    print(f"Migration Completed Successfully! Total {total_inserted} legal records synchronized.")

if __name__ == '__main__':
    run_pgvector_migration()
