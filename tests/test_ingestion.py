"""Tests for PDF ingestion pipeline (backend/ingestion.py).

WHY test ingestion?
The entire pipeline depends on ingestion being correct.
If it extracts too few clauses (over-filters) or too many (keeps noise),
every downstream classification result is wrong.

These are INTEGRATION tests — they read real PDF files from disk.
They will be skipped automatically if the PDFs aren't present.
"""
import pytest
from pathlib import Path
from backend.ingestion import extract_clauses, _is_noise

NEU_PDF = "data/policies/neu_academic_integrity.pdf.pdf"
HARVARD_PDF = "data/policies/harvard_ai_guidelines.pdf.pdf"
MIT_PDF = "data/policies/mit_handbook.pdf.pdf"


# Skip the whole test if the PDF doesn't exist on this machine
neu_available = pytest.mark.skipif(
    not Path(NEU_PDF).exists(), reason=f"{NEU_PDF} not found"
)
harvard_available = pytest.mark.skipif(
    not Path(HARVARD_PDF).exists(), reason=f"{HARVARD_PDF} not found"
)
mit_available = pytest.mark.skipif(
    not Path(MIT_PDF).exists(), reason=f"{MIT_PDF} not found"
)


class TestNoiseFilter:
    """Unit tests for _is_noise() — no PDF needed, pure logic."""

    def test_empty_string_is_noise(self):
        assert _is_noise("") is True

    def test_lone_page_number_is_noise(self):
        assert _is_noise("  42  ") is True

    def test_click_here_is_noise(self):
        assert _is_noise("Click here to file a report") is True

    def test_video_timestamp_is_noise(self):
        assert _is_noise("0:00 / 9:49") is True

    def test_explore_nav_is_noise(self):
        assert _is_noise("EXPLORE NORTHEASTERN Resources") is True

    def test_real_policy_clause_not_noise(self):
        clause = (
            "Students are expected to complete all work independently "
            "unless collaboration is explicitly permitted by the instructor."
        )
        assert _is_noise(clause) is False

    def test_toc_dots_is_noise(self):
        assert _is_noise("Academic Integrity ......... 12") is True

    def test_short_text_not_classified_as_noise(self):
        # _is_noise only checks patterns, NOT word count
        # Word count filter happens separately in extract_clauses
        assert _is_noise("This is fine.") is False


class TestExtractClauses:
    @neu_available
    def test_neu_clause_count_in_range(self):
        """NEU PDF should produce 40-70 clauses after noise filtering."""
        clauses = extract_clauses(NEU_PDF)
        assert 40 <= len(clauses) <= 70, (
            f"Expected 40-70 NEU clauses, got {len(clauses)}"
        )

    @neu_available
    def test_clauses_have_required_fields(self):
        clauses = extract_clauses(NEU_PDF)
        for clause in clauses:
            assert clause.id, "Every clause must have an id"
            assert clause.text, "Every clause must have text"
            assert clause.word_count >= 8, "Min word filter should be enforced"
            assert clause.page_num >= 1, "Page numbers start at 1"

    @neu_available
    def test_no_navigation_noise_in_clauses(self):
        clauses = extract_clauses(NEU_PDF)
        clause_texts = [c.text.lower() for c in clauses]
        for text in clause_texts:
            assert "click here" not in text, f"Nav noise found: {text[:60]}"
            assert "0:00 /" not in text, f"Video timestamp found: {text[:60]}"

    @neu_available
    def test_position_index_is_sequential(self):
        clauses = extract_clauses(NEU_PDF)
        for i, clause in enumerate(clauses):
            assert clause.position_index == i

    @harvard_available
    def test_harvard_clause_count_in_range(self):
        """Harvard PDF is small — should produce 10-30 clauses."""
        clauses = extract_clauses(HARVARD_PDF)
        assert 10 <= len(clauses) <= 30, (
            f"Expected 10-30 Harvard clauses, got {len(clauses)}"
        )

    @mit_available
    def test_mit_clause_count_large(self):
        """MIT handbook is large — should produce 300+ clauses."""
        clauses = extract_clauses(MIT_PDF)
        assert len(clauses) >= 300, (
            f"Expected 300+ MIT clauses, got {len(clauses)}"
        )

    @neu_available
    def test_no_duplicate_ids(self):
        clauses = extract_clauses(NEU_PDF)
        ids = [c.id for c in clauses]
        assert len(ids) == len(set(ids)), "All clause IDs must be unique"
