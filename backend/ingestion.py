from __future__ import annotations

import re
import uuid
from pathlib import Path

import pdfplumber

from backend.models import Clause

# Patterns that indicate noise lines (TOC entries, headers, footers, nav)
_NOISE_PATTERNS = [
    re.compile(r"^\s*\d+\s*$"),                      # lone page numbers
    re.compile(r"^\s*\.{3,}\s*\d+\s*$"),             # TOC dots + page number
    re.compile(r"(?i)^\s*(table of contents|contents)\s*$"),
    re.compile(r"(?i)^\s*(continued on next page|page \d+ of \d+)\s*$"),
    re.compile(r"(?i)^\s*(last updated|revised|effective date)"),
    re.compile(r"(?i)^\s*northeastern university\s*$"),
    re.compile(r"(?i)^\s*harvard university\s*$"),
    re.compile(r"(?i)^\s*massachusetts institute of technology\s*$"),
    re.compile(r"(?i)^\s*office of (student conduct|academic integrity)\s*$"),
    # Web/PDF navigation artifacts
    re.compile(r"(?i)click here"),                    # web nav links
    re.compile(r"\d+:\d{2}\s*/\s*\d+:\d{2}"),        # video timestamps (0:00 / 9:49)
    re.compile(r"(?i)^\s*EXPLORE\s+\w"),              # site nav ("EXPLORE NORTHEASTERN")
    re.compile(r"(?i)(menu\s+home\s+browse|browse\s+resources|programs\s*&\s*initiatives)"),
    re.compile(r"(?i)^\s*(skip to|jump to|back to top|return to)"),
    re.compile(r"(?i)^\s*(home|login|search|contact us|feedback)\s*$"),
    re.compile(r"[^\x00-\x7F]{3,}"),                 # runs of non-ASCII (web nav garbage)
]

_MIN_WORDS = 8
# Sentence boundary: period/question/exclamation followed by space + capital letter
_SENTENCE_SPLIT = re.compile(r"(?<=[.?!])\s+(?=[A-Z])")


def _is_noise(text: str) -> bool:
    stripped = text.strip()
    if not stripped:
        return True
    for pattern in _NOISE_PATTERNS:
        if pattern.search(stripped):
            return True
    return False


def _split_sentences(text: str) -> list[str]:
    sentences = _SENTENCE_SPLIT.split(text.strip())
    return [s.strip() for s in sentences if s.strip()]


def extract_clauses(pdf_path: str) -> list[Clause]:
    """Extract policy clauses from a PDF file."""
    path = Path(pdf_path)
    source_doc = path.name
    clauses: list[Clause] = []
    position_index = 0

    with pdfplumber.open(pdf_path) as pdf:
        for page in pdf.pages:
            page_num = page.page_number
            raw_text = page.extract_text()
            if not raw_text:
                continue

            # Split into paragraph-level chunks first
            paragraphs = re.split(r"\n{2,}", raw_text)

            for paragraph in paragraphs:
                paragraph = paragraph.replace("\n", " ").strip()

                if _is_noise(paragraph):
                    continue

                sentences = _split_sentences(paragraph)

                for sentence in sentences:
                    if _is_noise(sentence):
                        continue

                    word_count = len(sentence.split())
                    if word_count < _MIN_WORDS:
                        continue

                    clause = Clause(
                        id=str(uuid.uuid4()),
                        text=sentence,
                        source_doc=source_doc,
                        page_num=page_num,
                        position_index=position_index,
                        word_count=word_count,
                    )
                    clauses.append(clause)
                    position_index += 1

    return clauses
