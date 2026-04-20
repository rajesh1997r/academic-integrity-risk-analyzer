from __future__ import annotations

from typing import Optional
from pydantic import BaseModel, Field


class Clause(BaseModel):
    id: str
    text: str
    source_doc: str
    page_num: int
    position_index: int
    word_count: int


class RiskAnnotation(BaseModel):
    clause_id: str
    clause_text: str
    risk_category: str
    secondary_category: Optional[str] = None
    reasoning: str
    cited_text: str
    confidence: float
    low_confidence_flag: bool = False


class Contradiction(BaseModel):
    clause_a: Clause
    clause_b: Clause
    contradiction_type: str
    explanation: str
    scope_explains_conflict: bool


class AuditReport(BaseModel):
    source_doc: str
    total_clauses: int
    flagged_count: int
    annotations: list[RiskAnnotation]
    contradictions: list[Contradiction]
    faithfulness_score: float
    overall_risk_rating: str  # "Low" | "Medium" | "High"
    risk_distribution: dict[str, int]


class SyntheticClause(BaseModel):
    text: str
    category: str
    is_adversarial: bool
    human_accepted: bool = False


class EvaluationResult(BaseModel):
    accuracy: float
    precision_per_category: dict[str, float]
    recall_per_category: dict[str, float]
    confusion_matrix: dict[str, dict[str, int]]
    faithfulness_score: float
    hallucination_rate: float
    run_timestamp: str
