from typing import Dict, Any, Optional
from dataclasses import dataclass, asdict
from enum import Enum

class Jurisdiction(Enum):
    IN = "IN"
    UK = "UK"
    UAE = "UAE"

@dataclass
class Section:
    section_id: str
    section_number: str
    text: str
    act_id: str
    jurisdiction: Jurisdiction
    metadata: Optional[Dict[str, Any]] = None

    def __post_init__(self):
        if self.metadata is None:
            self.metadata = {}

    @property
    def title(self) -> str:
        if self.metadata and self.metadata.get("title"):
            return self.metadata["title"]
        if ":" in self.text:
            return self.text.split(":")[0]
        return self.text

    @property
    def punishment(self) -> str:
        return self.metadata.get("punishment", "") if self.metadata else ""

    def to_dict(self) -> Dict[str, Any]:
        result = asdict(self)
        result["jurisdiction"] = self.jurisdiction.value
        result["title"] = self.title
        result["punishment"] = self.punishment
        return result

    @classmethod
    def from_dict(cls, data: Dict[ str, Any]) -> 'Section':
        jurisdiction_str = data.get("jurisdiction", "IN")
        if isinstance(jurisdiction_str, str):
            try:
                jurisdiction = Jurisdiction(jurisdiction_str.upper())
            except ValueError:
                jurisdiction = Jurisdiction.IN
        else:
            jurisdiction = jurisdiction_str
            
        metadata = data.get("metadata", {})
        if "title" in data and "title" not in metadata:
            metadata["title"] = data["title"]
        if "punishment" in data and "punishment" not in metadata:
            metadata["punishment"] = data["punishment"]

        return cls(
            section_id=data.get("section_id", ""),
            section_number=data.get("section_number", ""),
            text=data.get("text", ""),
            act_id=data.get("act_id", ""),
            jurisdiction=jurisdiction,
            metadata=metadata
        )
