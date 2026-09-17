"""
Response Builder ?" TANTRA Strict Validator Gate
FAIL CLOSED: Missing fields, invalid enums, bad hashes +' HTTP 500.
No silent fallback. No graceful degradation.
"""
import hashlib
import json
import re
from datetime import datetime
from typing import Dict, Any, List

FORMATTER_VERSION = "3.0.0"
DETERMINISM_VERSION = "3.0.0"
SCHEMA_VERSION = "tantra_v3"
ANSWER_DISCLAIMER = (
    "NYAI output is advisory only and does not constitute legal advice, "
    "a binding determination, or enforcement authority. "
    "Consult a qualified legal professional before acting on this information."
)

# All 11 TANTRA-canonical fields that MUST be present
CANONICAL_FIELDS = [
    "trace_id",
    "request_id",
    "input_hash",
    "legal_context",
    "facts",
    "analysis",
    "recommendation",
    "explanation_chain",
    "risk_flags",
    "determinism_proof",
    "timestamp",
]

# Additional structural fields required for a complete response
STRUCTURAL_FIELDS = [
    "domain",
    "jurisdiction",
    "confidence",
    "legal_route",
]

# Contract-required fields from final_decision_contract.json v2.0.0
CONTRACT_FIELDS = [
    "schema_version",
    "answer_disclaimer",
]

VALID_RECOMMENDATION_TYPES = {"INFORM", "REVIEW", "ESCALATE", "INSUFFICIENT_DATA"}
HEX64_PATTERN = re.compile(r'^[0-9a-f]{64}$')


class SchemaValidationError(Exception):
    """FAIL CLOSED: Response does not meet TANTRA schema requirements."""
    def __init__(self, violations: List[str], trace_id: str = "UNKNOWN"):
        self.violations = violations
        self.trace_id = trace_id
        super().__init__(
            f"SchemaValidationError: {len(violations)} violation(s) for trace_id={trace_id}: "
            + "; ".join(violations)
        )


class HashMismatchError(Exception):
    """FAIL CLOSED: Determinism violation ?" output hashes do not match."""
    def __init__(self, expected: str, actual: str, trace_id: str = "UNKNOWN"):
        self.expected = expected
        self.actual = actual
        self.trace_id = trace_id
        super().__init__(
            f"HashMismatchError: expected={expected[:16]}... actual={actual[:16]}... trace_id={trace_id}"
        )


class TraceContinuityError(Exception):
    """FAIL CLOSED: Trace ID was mutated during pipeline execution."""
    def __init__(self, original: str, found: str):
        self.original = original
        self.found = found
        super().__init__(
            f"TraceContinuityError: original={original}, found={found}"
        )


class ErrorDetail(dict):
    def dict(self):
        return self


class ResponseBuilder:
    """
    TANTRA Strict Validator Gate.
    FAIL CLOSED on any schema violation.
    No response leaves without full validation.
    """

    @staticmethod
    def build_error_response(error_code: str, message: str, trace_id: str = "UNKNOWN"):
        return ErrorDetail({
            "error_code": error_code,
            "message": message,
            "trace_id": trace_id,
            "timestamp": datetime.utcnow().isoformat()
        })

    def build(self, raw_response: dict) -> dict:
        """
        Validate response against TANTRA canonical schema.
        Raises SchemaValidationError if ANY violation found.
        """
        trace_id = raw_response.get('trace_id', 'UNKNOWN')
        violations = []

        # Stamp contract identity fields before validation
        raw_response["schema_version"] = SCHEMA_VERSION
        raw_response["answer_disclaimer"] = ANSWER_DISCLAIMER

        # 1. Check all canonical fields present and non-None
        for field in CANONICAL_FIELDS:
            if field not in raw_response or raw_response[field] is None:
                violations.append(f"MISSING_FIELD: {field}")

        # 2. Check structural fields
        for field in STRUCTURAL_FIELDS:
            if field not in raw_response or raw_response[field] is None:
                violations.append(f"MISSING_STRUCTURAL_FIELD: {field}")

        # 3. Check contract fields
        for field in CONTRACT_FIELDS:
            if field not in raw_response or raw_response[field] is None:
                violations.append(f"MISSING_CONTRACT_FIELD: {field}")
        if raw_response.get("schema_version") != SCHEMA_VERSION:
            violations.append(
                f"INVALID_SCHEMA_VERSION: expected {SCHEMA_VERSION}, "
                f"got {raw_response.get('schema_version')}"
            )

        # If fields are missing, fail now (can't validate contents of missing fields)
        if violations:
            raise SchemaValidationError(violations, trace_id)

        # 4. Validate recommendation.type is valid enum
        rec = raw_response.get("recommendation", {})
        rec_type = rec.get("type") if isinstance(rec, dict) else getattr(rec, "type", None)
        rec_type_str = rec_type.value if hasattr(rec_type, 'value') else str(rec_type)
        if rec_type_str not in VALID_RECOMMENDATION_TYPES:
            violations.append(f"INVALID_ENUM: recommendation.type={rec_type_str}, expected one of {VALID_RECOMMENDATION_TYPES}")

        # 5. Validate facts is non-empty list of objects (not strings)
        facts = raw_response.get("facts", [])
        if not isinstance(facts, list) or len(facts) == 0:
            violations.append("EMPTY_FACTS: facts must contain at least 1 Fact object")
        else:
            for i, fact in enumerate(facts):
                f = fact if isinstance(fact, dict) else (fact.dict() if hasattr(fact, 'dict') else {})
                if not f.get("fact_id") or not f.get("statement") or not f.get("source"):
                    violations.append(f"INVALID_FACT[{i}]: must have fact_id, statement, source")

        # 6. Validate determinism_proof hashes are 64-char hex
        proof = raw_response.get("determinism_proof", {})
        proof_dict = proof if isinstance(proof, dict) else (proof.dict() if hasattr(proof, 'dict') else {})
        for hash_field in ["input_hash", "output_hash"]:
            h = proof_dict.get(hash_field, "")
            if not HEX64_PATTERN.match(str(h)):
                violations.append(f"INVALID_HASH: determinism_proof.{hash_field} must be 64-char lowercase hex")

        # 7. Validate explanation_chain contains structured steps
        chain = raw_response.get("explanation_chain", [])
        if not isinstance(chain, list) or len(chain) == 0:
            violations.append("EMPTY_EXPLANATION_CHAIN: must contain at least 1 ExplanationStep")

        # 8. Validate analysis.rule_application contains structured objects
        analysis = raw_response.get("analysis", {})
        analysis_dict = analysis if isinstance(analysis, dict) else (analysis.dict() if hasattr(analysis, 'dict') else {})
        rule_apps = analysis_dict.get("rule_application", [])
        for i, ra in enumerate(rule_apps):
            ra_dict = ra if isinstance(ra, dict) else (ra.dict() if hasattr(ra, 'dict') else {})
            if not ra_dict.get("law_id") or not ra_dict.get("application"):
                violations.append(f"INVALID_RULE_APPLICATION[{i}]: must have law_id and application")

        # FAIL CLOSED
        if violations:
            raise SchemaValidationError(violations, trace_id)

        # Stamp metadata as proof the response passed the TANTRA validator gate
        raw_response["metadata"] = {
            "formatted": True,
            "formatter_version": FORMATTER_VERSION,
            "formatted_at": datetime.utcnow().isoformat(),
            "schema_compliant": True,
            "canonical_fields_validated": len(CANONICAL_FIELDS),
            "structural_fields_validated": len(STRUCTURAL_FIELDS),
            "schema": "tantra_v3",
            "validation_mode": "FAIL_CLOSED",
        }

        return raw_response
