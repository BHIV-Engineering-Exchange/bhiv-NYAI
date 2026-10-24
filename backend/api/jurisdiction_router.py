from fastapi import APIRouter, Query, HTTPException
from typing import Optional, Dict, Any
from legal_database.multi_jurisdiction_db import multi_jurisdiction_db

jurisdiction_api_router = APIRouter(prefix="/jurisdictions", tags=["Multi-Jurisdiction Database"])

@app_router_get := jurisdiction_api_router.get("/statutes")
async def search_jurisdiction_statutes(
    q: str = Query(..., description="Legal query text or topic (e.g. Theft, Divorce, Labour)"),
    jurisdiction: Optional[str] = Query(None, description="Country jurisdiction: India | UAE | UK")
) -> Dict[str, Any]:
    """
    Multi-Jurisdiction Statutory Search Endpoint.
    Searches isolated legal statutory databases for India 🇮🇳, UAE 🇦🇪, and UK 🇬🇧.
    """
    try:
        results = multi_jurisdiction_db.search_statutes(query=q, jurisdiction=jurisdiction)
        return {
            "status": "success",
            "data": results
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Multi-jurisdiction search error: {str(e)}")
