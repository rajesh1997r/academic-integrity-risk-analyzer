"""Tests for Pydantic schemas (backend/models.py).

WHY test models?
Pydantic validates data at runtime. These tests confirm that:
- Valid data is accepted
- Invalid data raises clear errors
- Default values work as expected

This matters because every GPT-4o response gets parsed into these models.
If a model silently accepts garbage data, bugs are invisible until demo day.
"""
import pytest
from pydantic import ValidationError
from backend.models import (
    Clause, RiskAnnotation, Contradiction, AuditReport,
    SyntheticClause, EvaluationResult,
)


class TestClause:
    def test_valid_clause(self, sample_clause):
        assert sample_clause.word_count == 20
        assert sample_clause.source_doc == "neu_academic_integrity.pdf"

    def test_clause_requires_text(self):
        with pytest.raises(ValidationError):
            Clause(id="x", source_doc="doc.pdf", page_num=1,
                   position_index=0, word_count=5)  # missing text

    def test_clause_id_is_string(self, sample_clause):
        assert isinstance(sample_clause.id, str)


class TestRiskAnnotation:
    def test_valid_annotation(self, sample_annotation):
        assert sample_annotation.risk_category == "AIUsageLoophole"
        assert sample_annotation.confidence == 0.85
        assert sample_annotation.low_confidence_flag is False

    def test_secondary_category_optional(self, sample_annotation):
        assert sample_annotation.secondary_category is None

    def test_low_confidence_defaults_false(self, sample_clause):
        annotation = RiskAnnotation(
            clause_id="x",
            clause_text=sample_clause.text,
            risk_category="None",
            reasoning="ok",
            cited_text="ok",
            confidence=0.9,
        )
        assert annotation.low_confidence_flag is False

    def test_annotation_missing_cited_text_fails(self, sample_clause):
        with pytest.raises(ValidationError):
            RiskAnnotation(
                clause_id="x",
                clause_text=sample_clause.text,
                risk_category="Ambiguity",
                reasoning="some reason",
                confidence=0.8,
                # cited_text intentionally missing
            )


class TestAuditReport:
    def test_valid_report(self, sample_annotation):
        report = AuditReport(
            source_doc="neu.pdf",
            total_clauses=10,
            flagged_count=3,
            annotations=[sample_annotation],
            contradictions=[],
            faithfulness_score=0.85,
            overall_risk_rating="Medium",
            risk_distribution={"AIUsageLoophole": 3, "None": 7},
        )
        assert report.total_clauses == 10
        assert len(report.annotations) == 1

    def test_risk_rating_is_string(self, sample_annotation):
        report = AuditReport(
            source_doc="test.pdf",
            total_clauses=5,
            flagged_count=1,
            annotations=[sample_annotation],
            contradictions=[],
            faithfulness_score=1.0,
            overall_risk_rating="Low",
            risk_distribution={"None": 4, "AIUsageLoophole": 1},
        )
        assert report.overall_risk_rating in ("Low", "Medium", "High")


class TestSyntheticClause:
    def test_human_accepted_defaults_false(self):
        clause = SyntheticClause(
            text="Students must not use AI for exams.",
            category="AIUsageLoophole",
            is_adversarial=False,
        )
        assert clause.human_accepted is False

    def test_adversarial_flag(self):
        clause = SyntheticClause(
            text="Students should use best judgment.",
            category="Ambiguity",
            is_adversarial=True,
        )
        assert clause.is_adversarial is True
