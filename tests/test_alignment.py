"""Tests for faithfulness scoring (backend/alignment.py).

WHY test alignment?
The faithfulness score is what separates AIRA from a naive GPT wrapper.
It proves the model's cited_text actually came from the clause.

These are PURE UNIT TESTS — no API calls, no PDFs needed.
We test the math directly:
- cosine_similarity: does the geometry work?
- score_annotation: does the containment check work?
- compute_faithfulness: does the ratio compute correctly?
"""
import math
import pytest
from backend.alignment import cosine_similarity, score_annotation, compute_faithfulness
from backend.models import RiskAnnotation


def make_annotation(risk_category, cited_text, clause_text, confidence=0.9):
    """Helper to build a RiskAnnotation without repeating boilerplate."""
    return RiskAnnotation(
        clause_id="test-id",
        clause_text=clause_text,
        risk_category=risk_category,
        reasoning="test",
        cited_text=cited_text,
        confidence=confidence,
    )


class TestCosineSimilarity:
    """Test the cosine similarity math.

    Cosine similarity measures the angle between two vectors.
    - Identical vectors → 1.0 (same direction, angle = 0)
    - Opposite vectors → -1.0
    - Perpendicular vectors → 0.0 (no relationship)
    """

    def test_identical_vectors_return_one(self):
        v = [1.0, 0.0, 0.0]
        assert cosine_similarity(v, v) == pytest.approx(1.0)

    def test_orthogonal_vectors_return_zero(self):
        a = [1.0, 0.0]
        b = [0.0, 1.0]
        assert cosine_similarity(a, b) == pytest.approx(0.0)

    def test_opposite_vectors_return_minus_one(self):
        a = [1.0, 0.0]
        b = [-1.0, 0.0]
        assert cosine_similarity(a, b) == pytest.approx(-1.0)

    def test_zero_vector_returns_zero(self):
        # A zero-length vector has no direction — similarity is undefined, return 0
        assert cosine_similarity([0.0, 0.0], [1.0, 0.0]) == 0.0

    def test_similar_vectors_high_score(self):
        a = [0.9, 0.1]
        b = [0.8, 0.2]
        sim = cosine_similarity(a, b)
        assert sim > 0.98  # close directions → high similarity

    def test_dissimilar_vectors_low_score(self):
        a = [1.0, 0.0, 0.0]
        b = [0.0, 1.0, 0.0]
        assert cosine_similarity(a, b) == pytest.approx(0.0)


class TestScoreAnnotation:
    """Test the containment-first faithfulness scoring.

    Key insight: if cited_text is literally IN the clause_text,
    the citation is 100% faithful — no embedding needed.
    Only fall back to cosine similarity for paraphrased citations.
    """

    def test_exact_match_returns_one(self):
        annotation = make_annotation(
            risk_category="Ambiguity",
            clause_text="Students must submit work that reflects their own effort and understanding.",
            cited_text="their own effort and understanding",
        )
        score = score_annotation(annotation)
        assert score == 1.0

    def test_case_insensitive_match_returns_one(self):
        annotation = make_annotation(
            risk_category="EnforcementGap",
            clause_text="The Office of Student Conduct will investigate violations.",
            cited_text="OFFICE OF STUDENT CONDUCT",
        )
        assert score_annotation(annotation) == 1.0

    def test_none_category_always_returns_one(self):
        """Non-flagged clauses are trivially faithful — nothing to cite."""
        annotation = make_annotation(
            risk_category="None",
            clause_text="Students must attend class regularly.",
            cited_text="some text",
        )
        assert score_annotation(annotation) == 1.0

    def test_partial_match_in_clause_returns_one(self):
        annotation = make_annotation(
            risk_category="UndefinedTerm",
            clause_text="Unauthorized collaboration on graded assignments is prohibited.",
            cited_text="Unauthorized collaboration",
        )
        assert score_annotation(annotation) == 1.0


class TestComputeFaithfulness:
    """Test the aggregate faithfulness ratio.

    faithfulness = (annotations with score >= threshold) / total_flagged
    None-category annotations are excluded (they're trivially faithful).
    """

    def test_all_none_returns_one(self, none_annotation):
        """If nothing is flagged, faithfulness is perfect by definition."""
        score = compute_faithfulness([none_annotation, none_annotation])
        assert score == 1.0

    def test_empty_list_returns_one(self):
        assert compute_faithfulness([]) == 1.0

    def test_exact_citations_give_perfect_faithfulness(self):
        """All cited texts are verbatim substrings → all score 1.0 → faithfulness 1.0."""
        annotations = [
            make_annotation(
                "Ambiguity",
                "explicit faculty approval",
                "Students need explicit faculty approval to use AI tools.",
            ),
            make_annotation(
                "EnforcementGap",
                "no mechanism exists",
                "Violations are prohibited but no mechanism exists to enforce this rule.",
            ),
        ]
        score = compute_faithfulness(annotations)
        assert score == pytest.approx(1.0)

    def test_mixed_faithfulness_correct_ratio(self):
        """2 exact citations, 2 None → 2/2 flagged pass → 1.0."""
        annotations = [
            make_annotation("Ambiguity", "explicit approval", "Students need explicit approval."),
            make_annotation("None", "anything", "Clear clause with no issues."),
            make_annotation("EnforcementGap", "no enforcement", "There is no enforcement pathway."),
            make_annotation("None", "anything", "Another clear clause."),
        ]
        score = compute_faithfulness(annotations)
        assert score == pytest.approx(1.0)
