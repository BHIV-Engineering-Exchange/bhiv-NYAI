"""
Knowledge Ingestion Pipeline — Phase V.

Governed ingestion. No automatic publication: every asset remains in the
PENDING / DRAFT posture until explicitly promoted via the promotion pipeline.

Stages:
    1. Document registration (assign asset_id, version 1)
    2. Metadata extraction (populate KnowledgeMetadata)
    3. Schema validation (validate required fields)
    4. Duplicate detection (content-hash comparison)
    5. Version comparison (if existing asset_id supplied)
    6. Approval status assignment (always PENDING at ingestion)
    7. Ingestion logging (append to IngestionLog)
    8. Evidence record (via evidence_bridge.record_knowledge_operation, inside
       the repository register/update call)
"""
from __future__ import annotations

from dataclasses import dataclass, asdict
from typing import Any, Dict, Optional

import uuid

from knowledge.models import KnowledgeAsset, new_asset
from knowledge.repository import KnowledgeRepository, knowledge_repository
from knowledge.evidence_bridge import record_knowledge_operation
from ingestion.extractor import extract_metadata
from ingestion.logger import IngestionLog, IngestionLogEntry, ingestion_log, new_log_id
from ingestion.validator import content_hash_of, detect_duplicate, validate_schema


@dataclass
class IngestionResult:
    status: str                      # SUCCESS | REJECTED | DUPLICATE_REJECTED | SCHEMA_REJECTED
    operation: str                   # INGEST_NEW | INGEST_UPDATE | DUPLICATE_REJECTED | SCHEMA_REJECTED
    log_id: str
    asset_id: Optional[str] = None
    version_id: Optional[str] = None
    trace_id: Optional[str] = None   # evidence trace id
    content_hash: Optional[str] = None
    rejection_reason: Optional[str] = None
    duplicate_of: Optional[str] = None
    diff: Optional[Dict[str, Any]] = None

    def to_dict(self) -> Dict[str, Any]:
        return asdict(self)


class KnowledgeIngestionPipeline:
    def __init__(
        self,
        repository: Optional[KnowledgeRepository] = None,
        log: Optional[IngestionLog] = None,
    ):
        self._repo = repository or knowledge_repository
        self._log = log or ingestion_log

    # ── stage helpers (public for testing) ─────────────────────

    def validate_schema(self, document: Dict[str, Any]):
        return validate_schema(document)

    def detect_duplicate(self, content_hash: str) -> Optional[str]:
        return detect_duplicate(content_hash, repository=self._repo)

    def compare_versions(self, asset_id: str, new_content: Dict[str, Any]) -> Dict[str, Any]:
        """Compare new content against the latest stored version of an asset."""
        current = self._repo.get(asset_id)
        if current is None:
            return {"comparable": False, "reason": "asset_not_found", "differences": []}
        return _diff_content(current.content, new_content or {})

    # ── orchestration ──────────────────────────────────────────

    def ingest(
        self,
        document: Dict[str, Any],
        actor: str,
        jurisdiction: str,
        domain: str,
        source_attribution: str,
        existing_asset_id: Optional[str] = None,
    ) -> IngestionResult:
        document = dict(document or {})
        # Caller-supplied governance metadata takes precedence.
        document.setdefault("jurisdiction", jurisdiction)
        document.setdefault("domain", domain)
        document.setdefault("source_attribution", source_attribution)

        # Stage 3 — schema validation (fail closed).
        errors = validate_schema(document)
        if errors:
            reason = "; ".join(errors)
            log_id = new_log_id()
            self._log.append(IngestionLogEntry(
                log_id=log_id, asset_id="", version_id="", actor=actor,
                operation="SCHEMA_REJECTED", status="REJECTED",
                content_hash="", evidence_trace_id="", rejection_reason=reason,
            ))
            return IngestionResult(
                status="REJECTED", operation="SCHEMA_REJECTED", log_id=log_id,
                rejection_reason=reason,
            )

        content = document.get("content") or {}
        chash = content_hash_of(document)

        # Stage 1+2 — metadata extraction.
        metadata = extract_metadata(document)

        if existing_asset_id:
            # Stage 5 — version comparison + update flow.
            diff = self.compare_versions(existing_asset_id, content)
            if not diff.get("comparable", True):
                log_id = new_log_id()
                reason = f"existing_asset_id not found: {existing_asset_id}"
                self._log.append(IngestionLogEntry(
                    log_id=log_id, asset_id=existing_asset_id, version_id="", actor=actor,
                    operation="INGEST_UPDATE", status="REJECTED",
                    content_hash=chash, evidence_trace_id="", rejection_reason=reason,
                ))
                return IngestionResult(
                    status="REJECTED", operation="INGEST_UPDATE", log_id=log_id,
                    asset_id=existing_asset_id, content_hash=chash, rejection_reason=reason,
                )

            updated = self._repo.update(
                existing_asset_id,
                {
                    "content": content,
                    "metadata": {
                        "title": metadata.title,
                        "jurisdiction": metadata.jurisdiction,
                        "domain": metadata.domain,
                        "source_attribution": metadata.source_attribution,
                        "tags": metadata.tags,
                        "author": metadata.author,
                        "description": metadata.description,
                    },
                },
                updated_by=actor,
            )
            ingest_trace = record_knowledge_operation(
                operation="INGEST_UPDATE",
                asset_id=updated.identity.asset_id,
                version_id=updated.identity.version_id,
                trace_id=str(uuid.uuid4()),
                actor=actor,
                metadata={"jurisdiction": metadata.jurisdiction, "domain": metadata.domain,
                          "ingestion": True, "prior_register_trace": updated.governance.evidence_id},
                content_hash=updated.integrity.content_hash,
            )
            log_id = new_log_id()
            self._log.append(IngestionLogEntry(
                log_id=log_id, asset_id=updated.identity.asset_id,
                version_id=updated.identity.version_id, actor=actor,
                operation="INGEST_UPDATE", status="SUCCESS",
                content_hash=updated.integrity.content_hash,
                evidence_trace_id=ingest_trace,
            ))
            return IngestionResult(
                status="SUCCESS", operation="INGEST_UPDATE", log_id=log_id,
                asset_id=updated.identity.asset_id, version_id=updated.identity.version_id,
                trace_id=ingest_trace, content_hash=updated.integrity.content_hash,
                diff=diff,
            )

        # Stage 4 — duplicate detection for brand-new ingestion.
        duplicate_id = self.detect_duplicate(chash)
        if duplicate_id:
            log_id = new_log_id()
            reason = f"duplicate content of asset {duplicate_id}"
            self._log.append(IngestionLogEntry(
                log_id=log_id, asset_id=duplicate_id, version_id="", actor=actor,
                operation="DUPLICATE_REJECTED", status="REJECTED",
                content_hash=chash, evidence_trace_id="", rejection_reason=reason,
            ))
            return IngestionResult(
                status="DUPLICATE_REJECTED", operation="DUPLICATE_REJECTED", log_id=log_id,
                asset_id=duplicate_id, content_hash=chash, rejection_reason=reason,
                duplicate_of=duplicate_id,
            )

        # Stage 1 — registration (version 1, approval PENDING by default).
        asset = new_asset(
            title=metadata.title,
            jurisdiction=metadata.jurisdiction,
            domain=metadata.domain,
            source_attribution=metadata.source_attribution,
            content=content,
            tags=metadata.tags,
            author=metadata.author,
            description=metadata.description,
        )
        stored = self._repo.register(asset)

        ingest_trace = record_knowledge_operation(
            operation="INGEST_NEW",
            asset_id=stored.identity.asset_id,
            version_id=stored.identity.version_id,
            trace_id=str(uuid.uuid4()),
            actor=actor,
            metadata={"jurisdiction": metadata.jurisdiction, "domain": metadata.domain,
                      "ingestion": True, "register_trace": stored.governance.evidence_id},
            content_hash=stored.integrity.content_hash,
        )
        log_id = new_log_id()
        self._log.append(IngestionLogEntry(
            log_id=log_id, asset_id=stored.identity.asset_id,
            version_id=stored.identity.version_id, actor=actor,
            operation="INGEST_NEW", status="SUCCESS",
            content_hash=stored.integrity.content_hash,
            evidence_trace_id=ingest_trace,
        ))
        return IngestionResult(
            status="SUCCESS", operation="INGEST_NEW", log_id=log_id,
            asset_id=stored.identity.asset_id, version_id=stored.identity.version_id,
            trace_id=ingest_trace, content_hash=stored.integrity.content_hash,
        )


def _diff_content(old: Dict[str, Any], new: Dict[str, Any]) -> Dict[str, Any]:
    """Shallow structured diff between two content dicts."""
    old = old or {}
    new = new or {}
    old_keys = set(old.keys())
    new_keys = set(new.keys())
    added = sorted(new_keys - old_keys)
    removed = sorted(old_keys - new_keys)
    changed = sorted(k for k in (old_keys & new_keys) if old.get(k) != new.get(k))
    differences = (
        [{"field": k, "change": "added", "new": new.get(k)} for k in added]
        + [{"field": k, "change": "removed", "old": old.get(k)} for k in removed]
        + [{"field": k, "change": "modified", "old": old.get(k), "new": new.get(k)} for k in changed]
    )
    return {
        "comparable": True,
        "identical": len(differences) == 0,
        "added": added,
        "removed": removed,
        "changed": changed,
        "differences": differences,
        "summary": f"{len(added)} added, {len(removed)} removed, {len(changed)} modified",
    }


ingestion_pipeline = KnowledgeIngestionPipeline()


def ingest_clo_document(document: Dict[str, Any], actor: str = "clo_consumer") -> IngestionResult:
    """
    Ingest governed CLO knowledge using existing ingestion structures.
    """
    clo_document = dict(document or {})
    metadata = clo_document.get("metadata")
    if not isinstance(metadata, dict):
        metadata = {}
    metadata["source_system"] = "CLO"
    clo_document["metadata"] = metadata

    jurisdiction = str(
        clo_document.get("jurisdiction")
        or metadata.get("jurisdiction")
        or "Global"
    )
    domain = str(
        clo_document.get("domain")
        or metadata.get("domain")
        or "legal"
    )

    return ingestion_pipeline.ingest(
        document=clo_document,
        actor=actor,
        jurisdiction=jurisdiction,
        domain=domain,
        source_attribution="CLO",
    )
