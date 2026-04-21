"""Tests for the classification pipeline (backend/classifier.py).

WHY test with mocks?
The classifier calls GPT-4o which:
- Costs money per call
- Requires a network connection
- Is non-deterministic (results vary slightly)

Instead, we use unittest.mock to REPLACE the OpenAI API call with a
fake function that returns a controlled JSON response.
This lets us test that our PARSING CODE works correctly without any API calls.

Think of it like: instead of calling a real restaurant to test your ordering app,
you create a "fake restaurant" that always returns exactly what you tell it to.
"""
import json
import pytest
from unittest.mock import MagicMock, patch
from backend.models import Clause, RiskAnnotation


def make_clause(text="Students must not use AI for exams.", clause_id="test-001"):
    return Clause(
        id=clause_id,
        text=text,
        source_doc="test.pdf",
        page_num=1,
        position_index=0,
        word_count=len(text.split()),
    )


def mock_openai_response(json_content: dict):
    """Build a fake OpenAI API response object that mimics the real SDK structure."""
    mock_message = MagicMock()
    mock_message.content = json.dumps(json_content)
    mock_choice = MagicMock()
    mock_choice.message = mock_message
    mock_response = MagicMock()
    mock_response.choices = [mock_choice]
    return mock_response


class TestClassifyClause:
    """Tests for classify_clause() — the single-clause classification function."""

    @patch("backend.classifier._get_client")
    def test_valid_classification_parsed(self, mock_get_client):
        """Happy path: GPT-4o returns valid JSON → we parse it into RiskAnnotation."""
        fake_response = mock_openai_response({
            "risk_category": "AIUsageLoophole",
            "secondary_category": None,
            "reasoning": "The clause doesn't define what counts as AI-generated.",
            "cited_text": "artificial intelligence tools",
            "confidence": 0.85,
        })
        mock_client = MagicMock()
        mock_client.chat.completions.create.return_value = fake_response
        mock_get_client.return_value = mock_client

        from backend.classifier import classify_clause
        clause = make_clause("Students may not submit work created by artificial intelligence tools.")
        result = classify_clause(clause)

        assert isinstance(result, RiskAnnotation)
        assert result.risk_category == "AIUsageLoophole"
        assert result.confidence == 0.85
        assert result.cited_text == "artificial intelligence tools"

    @patch("backend.classifier._get_client")
    def test_invalid_category_falls_back_to_none(self, mock_get_client):
        """If GPT-4o returns a category not in our taxonomy, we default to None."""
        fake_response = mock_openai_response({
            "risk_category": "SomeInvalidCategory",
            "secondary_category": None,
            "reasoning": "unclear",
            "cited_text": "some text",
            "confidence": 0.5,
        })
        mock_client = MagicMock()
        mock_client.chat.completions.create.return_value = fake_response
        mock_get_client.return_value = mock_client

        from backend.classifier import classify_clause
        result = classify_clause(make_clause())
        assert result.risk_category == "None"

    @patch("backend.classifier._get_client")
    def test_confidence_clamped_to_valid_range(self, mock_get_client):
        """GPT-4o might return confidence > 1.0 or < 0.0. We clamp it."""
        fake_response = mock_openai_response({
            "risk_category": "Ambiguity",
            "secondary_category": None,
            "reasoning": "vague language",
            "cited_text": "best judgment",
            "confidence": 1.5,  # invalid — above 1.0
        })
        mock_client = MagicMock()
        mock_client.chat.completions.create.return_value = fake_response
        mock_get_client.return_value = mock_client

        from backend.classifier import classify_clause
        result = classify_clause(make_clause("Use best judgment when completing assignments."))
        assert 0.0 <= result.confidence <= 1.0

    @patch("backend.classifier._get_client")
    def test_low_confidence_flag_set_correctly(self, mock_get_client):
        """Annotations with confidence < 0.65 should be flagged as low confidence."""
        fake_response = mock_openai_response({
            "risk_category": "EnforcementGap",
            "secondary_category": None,
            "reasoning": "no enforcement mechanism",
            "cited_text": "violations are prohibited",
            "confidence": 0.50,  # below 0.65 threshold
        })
        mock_client = MagicMock()
        mock_client.chat.completions.create.return_value = fake_response
        mock_get_client.return_value = mock_client

        from backend.classifier import classify_clause
        result = classify_clause(make_clause("Violations are prohibited."))
        assert result.low_confidence_flag is True

    @patch("backend.classifier._get_client")
    def test_none_risk_not_low_confidence_flagged(self, mock_get_client):
        """A 'None' classification with low confidence is fine — nothing flagged."""
        fake_response = mock_openai_response({
            "risk_category": "None",
            "secondary_category": None,
            "reasoning": "clear clause",
            "cited_text": "Students must attend",
            "confidence": 0.40,
        })
        mock_client = MagicMock()
        mock_client.chat.completions.create.return_value = fake_response
        mock_get_client.return_value = mock_client

        from backend.classifier import classify_clause
        result = classify_clause(make_clause("Students must attend all scheduled exams."))
        assert result.risk_category == "None"

    @patch("backend.classifier._get_client")
    def test_classify_batch_returns_one_per_clause(self, mock_get_client):
        """classify_batch should return exactly one annotation per input clause."""
        fake_response = mock_openai_response({
            "risk_category": "None",
            "secondary_category": None,
            "reasoning": "clear",
            "cited_text": "students",
            "confidence": 0.9,
        })
        mock_client = MagicMock()
        mock_client.chat.completions.create.return_value = fake_response
        mock_get_client.return_value = mock_client

        from backend.classifier import classify_batch
        clauses = [make_clause(f"Clause number {i}.", f"id-{i}") for i in range(5)]
        results = classify_batch(clauses)

        assert len(results) == 5
        for i, result in enumerate(results):
            assert result.clause_id == f"id-{i}"
