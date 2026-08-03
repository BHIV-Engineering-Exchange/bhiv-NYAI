"""
TANTRA Output Bucket — Logs every NYAI output to disk.
Each entry is reproducible, auditable, and retrievable by trace_id.
"""
import json
import hashlib
import os
import threading
from datetime import datetime
from typing import Dict, Any, Optional


class OutputBucket:
    """
    Append-only output log. Every NYAI response is stored here.
    Entries are retrievable by trace_id and re-verifiable by hash.
    """

    def __init__(self, bucket_dir: str = None):
        if bucket_dir is None:
            bucket_dir = os.path.join(os.path.dirname(os.path.abspath(__file__)), "..", "output_logs")
        self.bucket_dir = bucket_dir
        os.makedirs(self.bucket_dir, exist_ok=True)
        self._log_file = os.path.join(self.bucket_dir, "nyai_output_log.jsonl")
        self._index: Dict[str, int] = {}  # trace_id → line offset
        self._line_count: int = 0
        self._lock = threading.Lock()
        self._rebuild_index()

    def _rebuild_index(self):
        """Rebuild in-memory index: trace_id -> line_number (0-based)."""
        self._line_count = 0
        if not os.path.exists(self._log_file):
            return
        try:
            with open(self._log_file, 'r', encoding='utf-8') as f:
                for line_num, line in enumerate(f):
                    self._line_count = line_num + 1
                    try:
                        entry = json.loads(line.strip())
                        tid = entry.get("trace_id")
                        if tid:
                            self._index[tid] = line_num
                    except json.JSONDecodeError:
                        continue
        except Exception:
            pass

    def store(self, response: Dict[str, Any]) -> Dict[str, str]:
        """
        Store a NYAI response. Returns storage receipt.
        """
        trace_id = response.get("trace_id", "UNKNOWN")
        proof = response.get("determinism_proof", {})
        if isinstance(proof, dict):
            input_hash = proof.get("input_hash", "")
            output_hash = proof.get("output_hash", "")
        else:
            input_hash = getattr(proof, "input_hash", "")
            output_hash = getattr(proof, "output_hash", "")

        entry = {
            "trace_id": trace_id,
            "input_hash": input_hash,
            "output_hash": output_hash,
            "timestamp": datetime.utcnow().isoformat(),
            "full_response": response,
        }

        # Compute verification hash of the entry
        entry_json = json.dumps(entry, sort_keys=True, default=str)
        entry_hash = hashlib.sha256(entry_json.encode('utf-8')).hexdigest()
        entry["entry_hash"] = entry_hash

        with self._lock:
            new_line_num = self._line_count
            with open(self._log_file, 'a', encoding='utf-8') as f:
                f.write(json.dumps(entry, sort_keys=True, default=str) + "\n")
            self._index[trace_id] = new_line_num
            self._line_count += 1

        receipt = {
            "stored": "true",
            "trace_id": trace_id,
            "entry_hash": entry_hash,
            "bucket_file": self._log_file,
        }

        # Phase VI: forward to BHIV Bucket when producer flag is enabled (local outbox first).
        try:
            from ecosystem.bucket_producer import forward_evidence_to_bucket

            bucket_result = forward_evidence_to_bucket(entry)
            if bucket_result:
                receipt["bucket_artifact_id"] = bucket_result.get("artifact_id")
                receipt["bucket_hash"] = bucket_result.get("hash")
        except Exception:
            pass

        return receipt

    def retrieve(self, trace_id: str) -> Optional[Dict[str, Any]]:
        """Retrieve stored response by trace_id using line-number index."""
        if not os.path.exists(self._log_file):
            return None
        if trace_id not in self._index:
            self._rebuild_index()
        if trace_id not in self._index:
            return None
        target_line = self._index[trace_id]
        with self._lock:
            with open(self._log_file, 'r', encoding='utf-8') as f:
                for idx, line in enumerate(f):
                    if idx == target_line:
                        try:
                            return json.loads(line.strip())
                        except json.JSONDecodeError:
                            return None
        return None

    def verify(self, trace_id: str) -> Dict[str, Any]:
        """
        Retrieve and re-verify a stored response.
        Recomputes the output_hash and compares.
        """
        entry = self.retrieve(trace_id)
        if not entry:
            return {"verified": False, "reason": "trace_id not found in bucket"}

        stored_output_hash = entry.get("output_hash", "")
        stored_entry_hash = entry.get("entry_hash", "")

        # Re-verify entry hash
        entry_copy = {k: v for k, v in entry.items() if k != "entry_hash"}
        recomputed = hashlib.sha256(
            json.dumps(entry_copy, sort_keys=True, default=str).encode('utf-8')
        ).hexdigest()

        return {
            "verified": recomputed == stored_entry_hash,
            "trace_id": trace_id,
            "stored_entry_hash": stored_entry_hash,
            "recomputed_entry_hash": recomputed,
            "output_hash": stored_output_hash,
            "tamper_detected": recomputed != stored_entry_hash,
        }


    def retrieve_as_evidence(self, trace_id: str):
        """Retrieve and wrap as EvidencePackage. Returns None if not found."""
        entry = self.retrieve(trace_id)
        if not entry:
            return None
        try:
            from evidence.models import EvidencePackage
            return EvidencePackage.from_stored_entry(entry)
        except Exception:
            return None

    def list_all(self, limit: int = None, offset: int = 0) -> list:
        """Return stored entries as list with optional pagination."""
        if not os.path.exists(self._log_file):
            return []
        entries = []
        with self._lock:
            with open(self._log_file, 'r', encoding='utf-8') as f:
                for idx, line in enumerate(f):
                    if idx < offset:
                        continue
                    if limit is not None and len(entries) >= limit:
                        break
                    try:
                        entries.append(json.loads(line.strip()))
                    except json.JSONDecodeError:
                        continue
        return entries


def _resolve_bucket_dir() -> str:
    configured = os.environ.get("OUTPUT_DIRECTORY", "").strip()
    if configured:
        return configured
    return os.path.join(os.path.dirname(os.path.abspath(__file__)), "..", "output_logs")


# Module-level singleton
output_bucket = OutputBucket(bucket_dir=_resolve_bucket_dir())
