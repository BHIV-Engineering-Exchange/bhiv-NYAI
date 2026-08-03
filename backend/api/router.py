import sys
import os
current_dir = os.path.dirname(os.path.abspath(__file__))
project_root = os.path.dirname(current_dir)
if project_root not in sys.path:
    sys.path.append(project_root)
if os.getcwd() not in sys.path:
    sys.path.append(os.getcwd())

from fastapi import APIRouter, HTTPException, Query, Request
from pydantic import BaseModel
from typing import Dict, Any, List, Optional
import uuid
import hashlib
import json
import re
import threading
import asyncio
from collections import OrderedDict
from datetime import datetime
from api.error_codes import ErrorCode

# Import enhanced components
from clean_legal_advisor import EnhancedLegalAdvisor, LegalQuery

# Import jurisdiction detector
from core.jurisdiction.detector import JurisdictionDetector

# Import case law components
from core.caselaw.loader import CaseLawLoader
from core.caselaw.retriever import CaseLawRetriever

# Import original schemas
from api.schemas import (
    QueryRequest, MultiJurisdictionRequest, ExplainReasoningRequest,
    FeedbackRequest, NyayaResponse, MultiJurisdictionResponse,
    ExplainReasoningResponse, FeedbackResponse, TraceResponse,
    StatuteSchema, ConfidenceSchema, CaseLawSchema,
    Recommendation, RecommendationType, LegalContext,
    AnalysisBlock, DeterminismProof,
    Fact, RuleApplication, ExplanationStep
)

# Import response enricher
from core.response.enricher import enrich_response
from services.explainer import generate_explanation_payload

# Determinism version tag
DETERMINISM_VERSION = "3.0.0"
DETERMINISM_GUARD_ENABLED = os.getenv("DETERMINISM_GUARD_ENABLED", "false").lower() not in {"0", "false", "no"}
from services.query_cleaner import clean_query
from services.query_understanding import analyze_query
from services.query_expander import expand_query
from services.retriever import get_hybrid_retriever
from services.reranker import rerank_sections
from services.legal_reasoner import apply_reasoning_rules

# ─── TANTRA Compliance ───
from observer.pipeline import ObserverPipeline
from api.response_builder import (
    ResponseBuilder, SchemaValidationError, HashMismatchError, TraceContinuityError,
    SCHEMA_VERSION, ANSWER_DISCLAIMER,
)
from tantra.output_bucket import output_bucket
from tantra.flow import run_tantra_flow
from provenance_chain.hash_chain_ledger import HashChainLedger
import logging

ledger = HashChainLedger()

router = APIRouter(prefix="/nyaya", tags=["nyaya"])
logger = logging.getLogger(__name__)

# Initialize the enhanced legal advisor with error handling
try:
    advisor = EnhancedLegalAdvisor()
    jurisdiction_detector = JurisdictionDetector()
    
    # Initialize case law system
    case_loader = CaseLawLoader()
    cases = case_loader.load_all()
    case_retriever = CaseLawRetriever(cases)
    print(f"Case law system initialized: {len(cases)} cases loaded")
    print("Jurisdiction detector initialized")
    print("Reasoning layer initialized")
except Exception as e:
    print(f"Error initializing components: {e}")
    advisor = None
    jurisdiction_detector = None
    case_retriever = None

# ─── Response Cache (thread-safe LRU for trace_id lookups) ───
class ResponseCache:
    """Thread-safe LRU cache for query responses keyed by trace_id."""
    def __init__(self, max_size=500):
        self.cache = OrderedDict()
        self.max_size = max_size
        self.lock = threading.Lock()

    def set(self, trace_id: str, response: dict):
        with self.lock:
            self.cache[trace_id] = response
            if len(self.cache) > self.max_size:
                self.cache.popitem(last=False)

    def get(self, trace_id: str):
        with self.lock:
            return self.cache.get(trace_id)

response_cache = ResponseCache()

# ─── Pydantic models for new endpoints ───
class RLSignalRequest(BaseModel):
    trace_id: str
    signal_type: str = "feedback"
    user_feedback: Optional[str] = "neutral"
    outcome_tag: Optional[str] = "pending"


def _resolve_trace_id(http_request: Optional[Request]) -> str:
    """Return middleware trace_id when present, else a deterministic fallback."""
    middleware_trace = (
        getattr(getattr(http_request, 'state', None), 'trace_id', None)
        if http_request is not None else None
    )
    return middleware_trace or f"trace_{datetime.now().strftime('%Y%m%d_%H%M%S')}_{uuid.uuid4().hex[:6]}"


@router.post("/query", response_model=NyayaResponse)
async def query_legal(request: QueryRequest, http_request: Request):
    """Execute a single-jurisdiction legal query with deterministic reasoning."""
    _temp_trace = _resolve_trace_id(http_request)
    try:
        cleaned_query = clean_query(request.query)

        # ─── TANTRA: Initialize Observer Pipeline ───
        observer = ObserverPipeline(trace_id=_temp_trace)
        observer.record("query_received", {"raw_query": request.query})

        understanding = analyze_query(cleaned_query)
        understanding_domain = understanding.get("domain") if isinstance(understanding, dict) else None
        if not isinstance(understanding_domain, str) or not understanding_domain.strip():
            understanding_domain = "civil"
        domain_hint_value = understanding_domain
        observer.record("query_understanding", {"domain": understanding_domain, "source": understanding.get("source", "unknown")})
        if not domain_hint_value and request.domain_hint:
            domain_hint_value = request.domain_hint.value
        expanded_queries = expand_query(cleaned_query, understanding_domain)
        observer.record("query_expansion", {"expanded_count": len(expanded_queries)})
        hybrid_result = {"candidates": [], "sections_found": 0, "query_logs": []}
        candidate_records = []

        from services.query_executor import run_hybrid_retrieval
        hybrid_result = run_hybrid_retrieval(expanded_queries, top_k=10)
        candidate_records = hybrid_result.get("candidate_records") or hybrid_result.get("candidates") or []
        observer.record("hybrid_retrieval", {"candidates_found": len(candidate_records)})

        from services.query_executor import run_reranker
        top_sections = run_reranker(cleaned_query, candidate_records, top_k=5) if candidate_records else []
        observer.record("cross_encoder_reranking", {"reranked_top": len(top_sections)})
        final_sections = apply_reasoning_rules(cleaned_query, understanding_domain, top_sections)
        reasoning_added = sum(
            1 for item in final_sections if item.get("source") == "reasoning_engine"
        )
        top_statutes = [
            {
                "act": item.get("act"),
                "year": item.get("year"),
                "section": item.get("section"),
                "title": item.get("title"),
                "source": item.get("source"),
            }
            for item in final_sections
        ]
        hybrid_result_public = {
            key: value for key, value in hybrid_result.items() if key != "candidate_records"
        }
        logger.info('original_query="%s" cleaned_query="%s"', request.query, cleaned_query)
        logger.info("expanded_queries=%s", expanded_queries)
        logger.info(
            "candidates_found=%s reranked_top=%s reasoning_added_sections=%s",
            len(candidate_records),
            len(top_sections),
            reasoning_added,
        )
        if understanding.get("source") == "local_fallback":
            logger.warning("LLM unavailable — using local fallback classifier.")

        # Check if advisor is initialized
        if advisor is None or jurisdiction_detector is None:
            raise HTTPException(
                status_code=500,
                detail={
                    "error_code": ErrorCode.ADVISOR_NOT_INITIALIZED,
                    "message": "Legal advisor failed to initialize. Check server logs.",
                    "trace_id": _temp_trace
                }
            )
        
        # Detect jurisdiction from query
        jurisdiction_hint_str = request.jurisdiction_hint.value if request.jurisdiction_hint else None
        jurisdiction_result = jurisdiction_detector.detect(
            query=cleaned_query,
            user_hint=jurisdiction_hint_str
        )
        
        # DO NOT BYPASS EnhancedLegalAdvisor
        # Get legal advice using the enhanced advisor - SINGLE SOURCE OF TRUTH
        legal_query = LegalQuery(
            query_text=cleaned_query,
            jurisdiction_hint=request.jurisdiction_hint,
            domain_hint=domain_hint_value,
            trace_id=_temp_trace
        )
        advice = advisor.provide_legal_advice(legal_query)
        observer.record("clean_legal_advisor", {"sections": len(advice.statutes or []), "domain": advice.domain, "jurisdiction": advice.jurisdiction})
        
        # Prefer deterministic pipeline statutes; fallback to advisor if empty
        statute_records = final_sections or []
        statute_source = "reasoning_pipeline"
        if not statute_records:
            statute_records = advice.statutes or []
            statute_source = "advisor_fallback"

        # ─── ACT-HINTS BRIDGE ───
        # If statutes are STILL empty but the LLM identified act_hints,
        # use those hints to find matching QUERY_STATUTE_OVERRIDES.
        # Fully dynamic — no hardcoded act map needed.
        if not statute_records and understanding and isinstance(understanding, dict):
            act_hints = understanding.get("act_hints", [])
            if act_hints:
                from clean_legal_advisor import QUERY_STATUTE_OVERRIDES
                # Normalize hints into matchable tokens
                hint_tokens = set()
                for hint in act_hints:
                    h = hint.lower().strip()
                    # Extract key identifiable words from the hint
                    # e.g. "the securitization and reconstruction... act, 2002" → "sarfaesi", "securitization"
                    # e.g. "section 185 of the motor vehicles act" → "motor vehicles"
                    hint_tokens.add(h)
                    # Also add individual meaningful words (3+ chars, skip articles/prepositions)
                    skip_words = {"the", "and", "for", "act", "section", "under", "with", "from", "that", "this", "any"}
                    for word in h.replace(",", "").replace(".", "").split():
                        if len(word) >= 3 and word not in skip_words:
                            hint_tokens.add(word)
                
                # Score each override rule by how many hint tokens match its act names
                best_rule = None
                best_score = 0
                for rule in QUERY_STATUTE_OVERRIDES:
                    score = 0
                    rule_text = " ".join(
                        s.get("act", "").lower() + " " + s.get("title", "").lower()
                        for s in rule.get("statutes", [])
                    )
                    for token in hint_tokens:
                        if token in rule_text:
                            score += len(token)  # Longer matches score higher
                    if score > best_score:
                        best_score = score
                        best_rule = rule
                
                # Only use if score is meaningful (at least one significant match)
                if best_rule and best_score >= 5:
                    statute_records = best_rule.get("statutes", [])
                    statute_source = "act_hints_bridge"

        statutes = []
        seen_statutes = set()
        for statute in statute_records:
            act = str(statute.get("act", "")).strip()
            section = str(statute.get("section", "")).strip()
            title = str(statute.get("title", "")).strip()
            if not act or not section:
                continue
            year_raw = statute.get("year")
            try:
                year = int(year_raw) if year_raw is not None else 0
            except (TypeError, ValueError):
                year = 0
            key = (act.lower(), section.lower(), year)
            if key in seen_statutes:
                continue
            seen_statutes.add(key)
            statute_schema = StatuteSchema(
                act=act,
                year=year,
                section=section,
                title=title
            )
            statutes.append(statute_schema)

        sections_found = len(statutes)
        top_statutes = []
        seen_top = set()
        for item in statute_records:
            act = str(item.get("act", "")).strip()
            section = str(item.get("section", "")).strip()
            title = str(item.get("title", "")).strip()
            if not act or not section:
                continue
            year_raw = item.get("year")
            try:
                year = int(year_raw) if year_raw is not None else 0
            except (TypeError, ValueError):
                year = 0
            key = (act.lower(), section.lower(), year)
            if key in seen_top:
                continue
            seen_top.add(key)
            top_statutes.append(
                {
                    "act": act,
                    "year": year,
                    "section": section,
                    "title": title,
                    "source": item.get("source") or statute_source,
                }
            )
        
        # Retrieve relevant case laws
        case_laws = []
        if case_retriever:
            relevant_cases = case_retriever.retrieve(
                query=cleaned_query,
                domain=advice.domain,
                jurisdiction=advice.jurisdiction,
                top_k=3
            )
            case_laws = [
                CaseLawSchema(
                    title=case.title,
                    court=case.court,
                    year=case.year,
                    principle=case.principle
                )
                for case in relevant_cases
            ]
        observer.record("case_law_retriever", {"cases_found": len(case_laws)})
        
        # Build qualified legal analysis
        legal_analysis = _build_qualified_analysis(
            cleaned_query,
            statutes,
            advice.jurisdiction
        )
        
        # Calculate structured confidence
        # TANTRA: Use jurisdiction_result.confidence (deterministic keyword detector)
        # instead of advice.confidence_score (LLM-influenced, may vary with rate limits)
        confidence = _calculate_structured_confidence(
            sections_found,
            jurisdiction_result.confidence,
            advice.domain,
            cleaned_query
        )
        
        response_domain = understanding_domain or advice.domain
        response_domains = []
        if isinstance(response_domain, str) and response_domain:
            response_domains.append(response_domain)
        if hasattr(advice, "domains") and isinstance(advice.domains, list):
            for item in advice.domains:
                if item and item not in response_domains:
                    response_domains.append(item)

        # Build response using enhanced advisor output
        base_response = {
            "domain": response_domain,
            "domains": response_domains or [response_domain],
            "jurisdiction": advice.jurisdiction,
            "jurisdiction_detected": jurisdiction_result.jurisdiction,
            "jurisdiction_confidence": jurisdiction_result.confidence,
            "confidence": confidence,
            "legal_route": [
                "query_cleaning",
                "query_understanding",
                "query_expansion",
                "hybrid_retrieval",
                "cross_encoder_reranking",
                "legal_reasoning_engine",
                "clean_legal_advisor",
                "case_law_retriever",
            ],
            "statutes": statutes,
            "case_laws": case_laws,
            "constitutional_articles": [],
            "provenance_chain": [observer.get_provenance_entry(
                agent="clean_legal_advisor",
                sections_found=sections_found,
                case_laws_found=len(case_laws),
                ontology_filtered=advice.ontology_filtered if hasattr(advice, 'ontology_filtered') else False,
                domains=advice.domains if hasattr(advice, 'domains') else [advice.domain],
                jurisdiction_detected=jurisdiction_result.jurisdiction,
                jurisdiction_confidence=jurisdiction_result.confidence
            )],
            "reasoning_trace": {
                "legal_analysis": legal_analysis,
                "procedural_steps": advice.procedural_steps,
                "remedies": advice.remedies,
                "sections_found": sections_found,
                "case_laws_found": len(case_laws),
                "statute_source": statute_source,
                "query_understanding": getattr(advice, "query_understanding", {}),
                "retrieval_metadata": {
                    **(getattr(advice, "retrieval_metadata", {}) or {}),
                    "expanded_queries": expanded_queries,
                    "hybrid_sections_found": hybrid_result.get("sections_found", 0),
                    "reranked_top": len(top_sections),
                    "reasoning_added_sections": reasoning_added,
                },
                "query_expansion": {
                    "search_queries": expanded_queries,
                    "domain": understanding_domain,
                },
                "hybrid_retrieval": hybrid_result_public,
                "top_statutes": top_statutes,
                "reasoning_engine": {
                    "added_sections": reasoning_added,
                    "final_statutes": top_statutes,
                },
                "intent_domain_understanding": understanding,
                "query_cleaning": {
                    "original": request.query,
                    "cleaned": cleaned_query,
                },
                "jurisdiction_detection": {
                    "detected": jurisdiction_result.jurisdiction,
                    "confidence": jurisdiction_result.confidence,
                    "user_provided": jurisdiction_hint_str is not None
                },
                "confidence_factors": {
                    "sections_matched": sections_found,
                    "jurisdiction_confidence": confidence.jurisdiction,
                    "domain_confidence": confidence.domain,
                    "statute_match": confidence.statute_match
                }
            },
            "trace_id": advice.trace_id,
            "remedies": advice.remedies,
            "procedural_steps": advice.procedural_steps
        }
        
        # Enrich response with timeline, glossary, evidence_requirements
        enriched = enrich_response(base_response, cleaned_query, advice.domain, statutes, advice.jurisdiction)
        
        # ─── REASONING LAYER: Build deterministic legal context ───
        # input_hash = sha256(full canonical input payload)
        canonical_input = json.dumps({
            "query": cleaned_query,
            "jurisdiction_hint": jurisdiction_hint_str,
            "domain_hint": domain_hint_value,
        }, sort_keys=True)
        input_hash = hashlib.sha256(canonical_input.encode('utf-8')).hexdigest()
        # Deterministic request_id — derived from input_hash, no randomness
        request_id = f"req_{input_hash[:12]}"
        timestamp_str = datetime.utcnow().isoformat() + "Z"

        # Legal context
        applicable_laws = list(set(
            s.act for s in statutes
        ))
        legal_context = LegalContext(
            jurisdiction=advice.jurisdiction,
            domain=response_domain,
            applicable_laws=applicable_laws
        )

        # Facts extraction — STRUCTURED Fact objects
        facts = []
        facts.append(Fact(fact_id="F1", statement=f"User query: {cleaned_query}", source="input"))
        facts.append(Fact(fact_id="F2", statement=f"Jurisdiction detected: {jurisdiction_result.jurisdiction} (confidence: {jurisdiction_result.confidence:.2f})", source="JurisdictionDetector"))
        facts.append(Fact(fact_id="F3", statement=f"Domain classified: {response_domain}", source="DomainClassifier"))
        facts.append(Fact(fact_id="F4", statement=f"Statutes matched: {sections_found}", source="BM25Search"))
        facts.append(Fact(fact_id="F5", statement=f"Case laws found: {len(case_laws)}", source="CaseLawRetriever"))
        if sections_found == 0:
            enriched.setdefault('risk_flags_extra', []).append("EMPTY_FACTS: No statutory provisions matched")

        # Analysis block — STRUCTURED RuleApplication objects
        issues_identified = []
        rule_application = []
        conflicts = []
        if sections_found == 0:
            issues_identified.append("No specific statutory provisions matched for this query")
        else:
            for s in statutes[:5]:
                rule_application.append(RuleApplication(
                    law_id=f"{s.act}:{s.section}",
                    application=s.title
                ))
        if jurisdiction_result.confidence < 0.5:
            issues_identified.append(f"Low jurisdiction confidence ({jurisdiction_result.confidence:.2f}) — results may be imprecise")
        if len(applicable_laws) > 3:
            conflicts.append("Multiple acts applicable — cross-reference required")
            enriched.setdefault('risk_flags_extra', []).append("CONFLICTING_LAWS: Multiple acts applicable")

        analysis = AnalysisBlock(
            issues_identified=issues_identified,
            rule_application=rule_application,
            conflicts=conflicts
        )

        # Recommendation (advisory only) — TANTRA canonical types
        rec_confidence = confidence.overall
        if sections_found > 0 and jurisdiction_result.confidence > 0.5:
            rec_type = RecommendationType.INFORM
            rec_rationale = f"Query resolved with {sections_found} statute(s) at {rec_confidence:.0%} confidence"
        elif sections_found > 0:
            rec_type = RecommendationType.REVIEW
            rec_rationale = f"Statutes found but jurisdiction confidence low ({jurisdiction_result.confidence:.2f})"
        elif jurisdiction_result.confidence > 0.5:
            rec_type = RecommendationType.ESCALATE
            rec_rationale = "No statutes matched — consider consulting a legal professional"
        else:
            rec_type = RecommendationType.INSUFFICIENT_DATA
            rec_rationale = "Insufficient data to provide reliable legal guidance"

        recommendation = Recommendation(
            type=rec_type,
            confidence=rec_confidence,
            rationale=rec_rationale
        )

        # Explanation chain — STRUCTURED ExplanationStep objects
        explanation_chain = [
            ExplanationStep(step_number=1, description=f"Query received and cleaned: '{cleaned_query}'", source="QueryCleaner"),
            ExplanationStep(step_number=2, description=f"Jurisdiction detected: {jurisdiction_result.jurisdiction} (confidence: {jurisdiction_result.confidence:.2f})", source="JurisdictionDetector"),
            ExplanationStep(step_number=3, description=f"Domain classified: {response_domain}", source="DomainClassifier"),
            ExplanationStep(step_number=4, description=f"BM25 full-text search executed across {getattr(advisor, 'section_count', 'N/A')} sections", source="BM25Search"),
            ExplanationStep(step_number=5, description="Statute overrides checked for keyword matches", source="ReasoningEngine"),
            ExplanationStep(step_number=6, description=f"{sections_found} relevant statute(s) identified", source="StatuteMerger"),
            ExplanationStep(step_number=7, description=f"{len(case_laws)} case law(s) retrieved", source="CaseLawRetriever"),
            ExplanationStep(step_number=8, description=f"Recommendation: {rec_type.value} — {rec_rationale}", source="RecommendationEngine"),
        ]

        # Risk flags
        risk_flags = list(enriched.pop('risk_flags_extra', []))
        sensitive_keywords = ['murder', 'rape', 'suicide', 'death', 'kill', 'bomb', 'terror']
        if any(kw in cleaned_query.lower() for kw in sensitive_keywords):
            risk_flags.append("SENSITIVE_CONTENT: Query involves serious criminal subject matter")
        if sections_found == 0:
            risk_flags.append("NO_STATUTES: No statutory provisions matched")
        if jurisdiction_result.confidence < 0.3:
            risk_flags.append("LOW_JURISDICTION_CONFIDENCE: Jurisdiction detection unreliable")

        # Determinism proof — hash canonical output (EXCLUDING timestamp)
        canonical_output = json.dumps({
            "statutes": [{"act": s.act, "section": s.section, "year": s.year} for s in statutes],
            "jurisdiction": advice.jurisdiction,
            "domain": response_domain,
            "recommendation": rec_type.value,
            "facts": [f.dict() for f in facts],
            "rule_application": [r.dict() for r in rule_application],
        }, sort_keys=True)
        output_hash = hashlib.sha256(canonical_output.encode('utf-8')).hexdigest()

        determinism_proof = DeterminismProof(
            input_hash=input_hash,
            output_hash=output_hash,
            version=DETERMINISM_VERSION
        )

        # Inject new fields into enriched response
        enriched['request_id'] = request_id
        enriched['input_hash'] = input_hash
        enriched['timestamp'] = timestamp_str
        enriched['legal_context'] = legal_context.dict()
        enriched['facts'] = [f.dict() for f in facts]
        enriched['analysis'] = analysis.dict()
        enriched['recommendation'] = recommendation.dict()
        enriched['explanation_chain'] = [s.dict() for s in explanation_chain]
        enriched['risk_flags'] = risk_flags
        enriched['determinism_proof'] = determinism_proof.dict()

        # ─── confidence_sources ───
        enriched['confidence_sources'] = {
            "sections_found": sections_found,
            "base_confidence": advice.confidence_score,
            "jurisdiction_confidence": jurisdiction_result.confidence,
            "domain_confidence": confidence.domain,
            "statute_match": confidence.statute_match,
            "understanding_source": understanding.get("source", "unknown") if isinstance(understanding, dict) else "unknown",
            "statute_source": statute_source
        }

        explanation_payload = generate_explanation_payload(
            query=cleaned_query,
            jurisdiction=advice.jurisdiction,
            domain=advice.domain,
            statutes=final_sections,
        )
        enriched["answer"] = explanation_payload["text"]
        enriched["answer_source"] = explanation_payload["source"]
        enriched["answer_model"] = explanation_payload.get("model")
        explanation_debug = {
            "source": explanation_payload.get("source"),
            "model": explanation_payload.get("model"),
        }
        if explanation_payload.get("reason"):
            explanation_debug["reason"] = explanation_payload.get("reason")
        if explanation_payload.get("error"):
            explanation_debug["error"] = explanation_payload.get("error")
        if "reasoning_trace" in enriched and (explanation_debug.get("reason") or explanation_debug.get("error")):
            enriched["reasoning_trace"]["explanation_generation"] = explanation_debug

        # ─── TANTRA: Observer steps ───
        observer.record("response_enriched", {"has_answer": bool(enriched.get("answer"))})
        enriched['observer_steps'] = observer.get_observer_steps()

        # ─── TANTRA: Contract identity fields (required by final_decision_contract v2.0.0) ───
        enriched["schema_version"] = SCHEMA_VERSION
        enriched["answer_disclaimer"] = ANSWER_DISCLAIMER

        # ─── TANTRA: Observer Validation Gate ───
        observer_result = observer.validate_response(enriched)
        enriched['observer_validation'] = observer_result.to_dict()
        if not observer_result.passed:
            raise SchemaValidationError(
                observer_result.violations,
                trace_id=enriched.get('trace_id', 'UNKNOWN')
            )

        # ─── TANTRA: Formatter Gate (FAIL CLOSED) ───
        builder = ResponseBuilder()
        enriched = builder.build(enriched)

        # ─── TANTRA: trace_guard — ensure trace_id not mutated ───
        final_trace = enriched.get('trace_id', '')
        if final_trace != _temp_trace and final_trace != advice.trace_id:
            raise TraceContinuityError(_temp_trace, final_trace)

        # ─── TANTRA: Output Bucket — log every output ───
        try:
            output_bucket.store(enriched)
        except Exception as bucket_err:
            logger.warning("Output bucket storage failed: %s", bucket_err)

        # ─── Phase VI: InsightFlow telemetry (fail-open, gated) ───
        try:
            from ecosystem.insightflow_publisher import publish_query_telemetry

            publish_query_telemetry(enriched)
        except ImportError:
            pass
        except Exception as telemetry_err:
            logger.warning("InsightFlow telemetry publish failed: %s", telemetry_err)

        # ─── TANTRA: Hash Chain Ledger — append provenance entry ───
        try:
            proof_dict = enriched.get("determinism_proof") or {}
            if hasattr(proof_dict, 'dict'):
                proof_dict = proof_dict.dict()
            ledger.append_event({
                "trace_id": enriched.get("trace_id"),
                "input_hash": enriched.get("input_hash"),
                "output_hash": proof_dict.get("output_hash", "") if isinstance(proof_dict, dict) else "",
                "timestamp": enriched.get("timestamp"),
                "schema_version": "tantra_v3",
                "domain": enriched.get("domain"),
                "jurisdiction": enriched.get("jurisdiction"),
                "recommendation_type": (enriched.get("recommendation") or {}).get("type", ""),
            })
        except Exception as ledger_err:
            logger.warning("Hash chain ledger append failed: %s", ledger_err)

        # Cache the enriched response for downstream endpoints
        response_cache.set(enriched.get("trace_id", advice.trace_id), enriched)

        return NyayaResponse(**enriched)
        
    except SchemaValidationError as sve:
        raise HTTPException(
            status_code=500,
            detail={
                "error_code": ErrorCode.SCHEMA_VALIDATION_ERROR,
                "message": str(sve),
                "violations": sve.violations,
                "trace_id": sve.trace_id
            }
        )
    except HashMismatchError as hme:
        raise HTTPException(
            status_code=500,
            detail={
                "error_code": ErrorCode.HASH_MISMATCH_ERROR,
                "message": str(hme),
                "trace_id": hme.trace_id
            }
        )
    except TraceContinuityError as tce:
        raise HTTPException(
            status_code=500,
            detail={
                "error_code": ErrorCode.TRACE_CONTINUITY_ERROR,
                "message": str(tce),
                "trace_id": tce.original
            }
        )
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail={
                "error_code": ErrorCode.QUERY_PROCESSING_ERROR,
                "message": f"Error processing legal query: {str(e)}",
                "trace_id": _temp_trace
            }
        )

_STATUTE_REPR_FIELD = re.compile(r"(\w+)='([^']*)'")


def _normalize_statute_summary(statute: Any) -> Dict[str, str]:
    """Normalize statute entries from L1 cache, L2 bucket (repr strings), or Pydantic models."""
    if isinstance(statute, dict):
        return {
            "act": str(statute.get("act") or ""),
            "section": str(statute.get("section") or ""),
            "title": str(statute.get("title") or ""),
        }
    if isinstance(statute, str):
        fields = dict(_STATUTE_REPR_FIELD.findall(statute))
        if fields:
            return {
                "act": fields.get("act", ""),
                "section": fields.get("section", ""),
                "title": fields.get("title", ""),
            }
        return {"act": "", "section": "", "title": statute}
    if hasattr(statute, "model_dump"):
        dumped = statute.model_dump()
        return {
            "act": str(dumped.get("act") or ""),
            "section": str(dumped.get("section") or ""),
            "title": str(dumped.get("title") or ""),
        }

    def _safe_attr(name: str) -> str:
        value = getattr(statute, name, "")
        if callable(value):
            return ""
        return str(value or "")

    return {"act": _safe_attr("act"), "section": _safe_attr("section"), "title": _safe_attr("title")}


def _build_qualified_analysis(query: str, statutes: List, jurisdiction: str) -> str:
    """Build legal analysis with fully qualified statute references"""
    if not statutes:
        return f"No specific legal provisions found for this query in {jurisdiction} jurisdiction. Please provide more specific details or consult a legal professional."
    
    analysis = f"Legal Analysis for {jurisdiction} Jurisdiction:\n\n"
    analysis += "Applicable Legal Provisions:\n"
    analysis += "=" * 50 + "\n\n"
    
    for i, statute in enumerate(statutes, 1):
        analysis += f"{i}. Section {statute.section} of {statute.act}, {statute.year}:\n"
        analysis += f"   {statute.title}\n\n"
    
    return analysis

def _calculate_structured_confidence(
    sections_count: int,
    base_confidence: float,
    domain: str,
    query: str
) -> ConfidenceSchema:
    """Calculate structured confidence scores"""
    # Statute match confidence
    statute_match = min(0.95, 0.3 + (sections_count * 0.1)) if sections_count > 0 else 0.3
    
    # Domain confidence
    domain_keywords = {
        'criminal': ['crime', 'theft', 'murder', 'assault', 'terrorism'],
        'family': ['divorce', 'marriage', 'custody', 'alimony'],
        'civil': ['property', 'contract', 'consumer', 'employment']
    }
    
    domain_conf = 0.7
    if domain in domain_keywords:
        query_lower = query.lower()
        matches = sum(1 for kw in domain_keywords[domain] if kw in query_lower)
        domain_conf = min(0.95, 0.7 + (matches * 0.05))
    
    # Procedural match (placeholder)
    procedural_match = 0.8
    
    # Overall confidence
    overall = (base_confidence + statute_match + domain_conf) / 3
    
    return ConfidenceSchema(
        overall=min(0.95, overall),
        jurisdiction=base_confidence,
        domain=domain_conf,
        statute_match=statute_match,
        procedural_match=procedural_match
    )

@router.post("/multi_jurisdiction", response_model=MultiJurisdictionResponse)
async def multi_jurisdiction_query(request: MultiJurisdictionRequest, http_request: Request):
    """Multi Jurisdiction Query"""
    return MultiJurisdictionResponse(
        comparative_analysis={},
        confidence=0.5,
        trace_id=_resolve_trace_id(http_request)
    )

@router.post("/explain_reasoning", response_model=ExplainReasoningResponse)
async def explain_reasoning(request: ExplainReasoningRequest):
    """Explain Reasoning"""
    return ExplainReasoningResponse(
        trace_id=request.trace_id,
        explanation={"message": "Reasoning explanation"},
        reasoning_tree={"root": "explanation_tree"},
        constitutional_articles=[]
    )

@router.post("/feedback", response_model=FeedbackResponse)
async def submit_feedback(request: FeedbackRequest):
    """Submit Feedback"""
    return FeedbackResponse(
        status="received",
        trace_id=request.trace_id,
        message="Feedback submitted successfully"
    )

@router.get("/trace/{trace_id}", response_model=TraceResponse)
async def get_trace(trace_id: str):
    """Replay trace from output bucket with tamper verification."""
    stored = output_bucket.retrieve(trace_id)
    if not stored:
        raise HTTPException(
            status_code=404,
            detail={"error": "trace_id not found in output bucket", "trace_id": trace_id}
        )

    verification = output_bucket.verify(trace_id)
    full_response = stored.get("full_response") or {}
    observer_steps = full_response.get("observer_steps") or []
    event_chain = [
        {
            "index": idx,
            "stage": step.get("stage"),
            "timestamp": step.get("timestamp"),
            "trace_id": step.get("trace_id"),
            "observed": step.get("observed", {}),
        }
        for idx, step in enumerate(observer_steps)
    ]

    proof = full_response.get("determinism_proof") or {}
    if hasattr(proof, 'dict'):
        proof = proof.dict()

    legal_route = full_response.get("legal_route") or []
    jurisdiction_hops = list({
        full_response.get("jurisdiction_detected") or full_response.get("jurisdiction") or ""
    })

    return TraceResponse(
        trace_id=trace_id,
        event_chain=event_chain,
        agent_routing_tree={"legal_route": legal_route},
        jurisdiction_hops=[h for h in jurisdiction_hops if h],
        rl_reward_snapshot={},
        context_fingerprint=stored.get("input_hash") or full_response.get("input_hash", ""),
        nonce_verification=verification.get("verified", False),
        signature_verification=verification.get("verified", False),
        input_hash=stored.get("input_hash") or full_response.get("input_hash"),
        output_hash=stored.get("output_hash") or (proof.get("output_hash") if isinstance(proof, dict) else None),
        provenance_chain=full_response.get("provenance_chain"),
        tamper_verified=verification.get("verified", False),
        stored_at=stored.get("timestamp"),
        replay_source="output_bucket",
    )


@router.get("/output/{trace_id}")
async def get_output(trace_id: str):
    """Retrieve stored output with hash verification for external auditors."""
    stored = output_bucket.retrieve(trace_id)
    if not stored:
        raise HTTPException(
            status_code=404,
            detail={"error": "trace_id not found in output bucket", "trace_id": trace_id}
        )

    verification = output_bucket.verify(trace_id)
    full_response = stored.get("full_response") or {}
    proof = full_response.get("determinism_proof") or stored.get("determinism_proof") or {}
    if hasattr(proof, 'dict'):
        proof = proof.dict()

    return {
        "trace_id": trace_id,
        "stored_output": stored,
        "verification": verification,
        "hash_proof": {
            "input_hash": stored.get("input_hash", "") or full_response.get("input_hash", ""),
            "output_hash": proof.get("output_hash", "") if isinstance(proof, dict) else stored.get("output_hash", ""),
            "tamper_detected": not verification.get("verified", True),
        },
        "retrieved_at": datetime.utcnow().isoformat() + "Z",
    }


@router.post("/tantra_flow")
async def execute_tantra_flow(request: QueryRequest, http_request: Request):
    """Execute full TANTRA flow. Advisory participation only. No authority transfer."""
    try:
        jurisdiction_hint = request.jurisdiction_hint.value if request.jurisdiction_hint else "India"
        port = os.getenv("PORT", "8000")
        nyai_url = f"http://127.0.0.1:{port}/nyaya/query"
        api_key = http_request.headers.get("X-API-Key") or os.environ.get("NYAI_API_KEY", "")
        flow_proof = await asyncio.to_thread(
            run_tantra_flow,
            request.query,
            jurisdiction_hint,
            nyai_url,
            api_key,
        )
        return {
            "status": flow_proof.get("flow_status"),
            "trace_id": flow_proof.get("trace_id"),
            "sovereign_receipt": flow_proof["stages"]["sovereign_core"],
            "bucket_verified": flow_proof.get("bucket_verified"),
            "trace_continuity": flow_proof.get("trace_continuity"),
            "input_hash_continuity": flow_proof.get("input_hash_continuity"),
            "flow_proof": flow_proof,
            "authority_note": "Advisory participation only. No enforcement authority transferred.",
        }
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail={"error": "TANTRA flow failed", "reason": str(e)}
        )

# ═══════════════════════════════════════════════════════════════
# NEW INTEGRATION ENDPOINTS (consumed by frontend components)
# ═══════════════════════════════════════════════════════════════

@router.get("/case_summary")
async def get_case_summary(trace_id: str = Query(..., description="Trace ID from a previous /query call")):
    """Return a summarised view of a cached query response."""
    from services.evidence_service import resolve_cached_response
    cached = resolve_cached_response(trace_id, response_cache)
    if not cached:
        raise HTTPException(status_code=404, detail={"error": "trace_id not found", "trace_id": trace_id})
    statutes = cached.get("statutes", [])
    statute_list = [_normalize_statute_summary(s) for s in (statutes or [])]
    return {
        "trace_id": trace_id,
        "jurisdiction": cached.get("jurisdiction_detected") or cached.get("jurisdiction"),
        "domain": cached.get("domain"),
        "confidence": cached.get("confidence"),
        "recommendation": cached.get("recommendation"),
        "key_statutes": statute_list[:5],
        "summary_text": (cached.get("reasoning_trace") or {}).get("legal_analysis", "")[:500]
    }


@router.get("/legal_routes")
async def get_legal_routes(trace_id: str = Query(..., description="Trace ID from a previous /query call")):
    """Return the legal processing route for a cached query."""
    from services.evidence_service import resolve_cached_response
    cached = resolve_cached_response(trace_id, response_cache)
    if not cached:
        raise HTTPException(status_code=404, detail={"error": "trace_id not found", "trace_id": trace_id})
    legal_route = cached.get("legal_route", [])
    routes = []
    for step in legal_route:
        routes.append({
            "name": step.replace("_", " ").title() if isinstance(step, str) else str(step),
            "description": f"Processing stage: {step}",
            "status": "completed"
        })
    return {
        "trace_id": trace_id,
        "routes": routes,
        "procedural_steps": (cached.get("reasoning_trace") or {}).get("procedural_steps", []),
        "remedies": (cached.get("reasoning_trace") or {}).get("remedies", [])
    }


@router.get("/timeline")
async def get_timeline(trace_id: str = Query(..., description="Trace ID from a previous /query call")):
    """Return the procedural timeline for a cached query."""
    from services.evidence_service import resolve_cached_response
    cached = resolve_cached_response(trace_id, response_cache)
    if not cached:
        raise HTTPException(status_code=404, detail={"error": "trace_id not found", "trace_id": trace_id})
    timeline = cached.get("timeline", [])
    steps = []
    for idx, item in enumerate(timeline, 1):
        if isinstance(item, dict):
            steps.append({"milestone": idx, "step": item.get("step", ""), "eta": item.get("eta", "Varies")})
        else:
            steps.append({"milestone": idx, "step": str(item), "eta": "Varies"})
    return {
        "trace_id": trace_id,
        "steps": steps
    }


@router.get("/glossary")
async def get_glossary(trace_id: str = Query(..., description="Trace ID from a previous /query call")):
    """Return the legal glossary terms for a cached query."""
    from services.evidence_service import resolve_cached_response
    cached = resolve_cached_response(trace_id, response_cache)
    if not cached:
        raise HTTPException(status_code=404, detail={"error": "trace_id not found", "trace_id": trace_id})
    glossary = cached.get("glossary", [])
    terms = []
    for item in glossary:
        if isinstance(item, dict):
            terms.append({"term": item.get("term", ""), "definition": item.get("definition", "")})
        else:
            terms.append({"term": str(item), "definition": ""})
    return {
        "trace_id": trace_id,
        "terms": terms
    }


@router.get("/jurisdiction_info")
async def get_jurisdiction_info(jurisdiction: str = Query(..., description="Jurisdiction code: India, UK, UAE, KSA")):
    """Return static metadata for a jurisdiction."""
    JURISDICTION_DATA = {
        "India": {
            "code": "IN",
            "name": "Republic of India",
            "legal_system": "Common Law (derived from British system)",
            "court_structure": "Supreme Court → High Courts → District Courts → Magistrate Courts",
            "key_acts": ["Indian Penal Code 1860", "Bharatiya Nyaya Sanhita 2023", "Code of Criminal Procedure 1973", "Code of Civil Procedure 1908", "Indian Evidence Act 1872", "Information Technology Act 2000"]
        },
        "UK": {
            "code": "GB",
            "name": "United Kingdom",
            "legal_system": "Common Law",
            "court_structure": "Supreme Court → Court of Appeal → High Court → Crown/County Courts → Magistrates' Courts",
            "key_acts": ["Criminal Justice Act 2003", "Theft Act 1968", "Human Rights Act 1998", "Civil Procedure Rules 1998", "Equality Act 2010"]
        },
        "UAE": {
            "code": "AE",
            "name": "United Arab Emirates",
            "legal_system": "Civil Law (with Sharia influence)",
            "court_structure": "Federal Supreme Court → Courts of Appeal → Courts of First Instance",
            "key_acts": ["Federal Penal Code", "Civil Transactions Law", "Labour Law", "Personal Status Law", "Commercial Transactions Law"]
        },
        "KSA": {
            "code": "SA",
            "name": "Kingdom of Saudi Arabia",
            "legal_system": "Sharia Law (with Royal Decrees)",
            "court_structure": "Supreme Court → Courts of Appeal → General/Criminal Courts",
            "key_acts": ["Basic Law of Governance", "Law of Procedure before Sharia Courts", "Labour Law", "Anti-Cyber Crime Law"]
        }
    }
    # Normalise key lookup
    key = jurisdiction.strip()
    data = JURISDICTION_DATA.get(key)
    if not data:
        # Try case-insensitive match
        for k, v in JURISDICTION_DATA.items():
            if k.lower() == key.lower():
                data = v
                break
    if not data:
        raise HTTPException(status_code=404, detail={"error": f"Unknown jurisdiction: {jurisdiction}"})
    return data


@router.get("/recommendation_status")
async def get_recommendation_status(trace_id: str = Query(..., description="Trace ID from a previous /query call")):
    """Return the recommendation details for a cached query."""
    from services.evidence_service import resolve_cached_response
    cached = resolve_cached_response(trace_id, response_cache)
    if not cached:
        raise HTTPException(status_code=404, detail={"error": "trace_id not found", "trace_id": trace_id})
    provenance = cached.get("provenance_chain", [{}])
    first_prov = provenance[0] if provenance else {}
    return {
        "trace_id": trace_id,
        "decision": (cached.get("recommendation") or {}).get("type", "UNKNOWN"),
        "jurisdiction_detected": first_prov.get("jurisdiction_detected"),
        "jurisdiction_confidence": first_prov.get("jurisdiction_confidence"),
        "timestamp": first_prov.get("timestamp"),
        "sections_found": first_prov.get("sections_found", 0),
        "domains": first_prov.get("domains", [])
    }


@router.post("/rl_signal")
async def submit_rl_signal(request: RLSignalRequest):
    """Accept a reinforcement learning signal from the frontend."""
    # ─── TANTRA: RL Signal Lock — reject signals for unknown trace_ids ───
    cached = response_cache.get(request.trace_id)
    if not cached:
        return {
            "accepted": False,
            "reward_computed": 0.0,
            "reason": "trace_id_not_found — RL signals must reference a valid, cached query",
            "trace_id": request.trace_id
        }
    try:
        from rl_engine.reward_engine import RewardEngine
        reward_engine = RewardEngine()
        signal = {
            "trace_id": request.trace_id,
            "user_feedback": request.user_feedback,
            "outcome_tag": request.outcome_tag,
            "timestamp": datetime.utcnow().isoformat()
        }
        reward, should_learn, reason = reward_engine.compute_reward(signal)
        return {
            "accepted": should_learn,
            "reward_computed": reward,
            "reason": reason if reason else "signal_accepted",
            "trace_id": request.trace_id
        }
    except Exception as e:
        logger.warning("RL signal processing failed: %s", e)
        return {
            "accepted": False,
            "reward_computed": 0.0,
            "reason": f"processing_error: {str(e)}",
            "trace_id": request.trace_id
        }
