from __future__ import annotations

import math
import os

from dotenv import load_dotenv
from openai import OpenAI

load_dotenv()

from backend.models import RiskAnnotation

_client: OpenAI | None = None
_DEFAULT_THRESHOLD = 0.65


def _get_client() -> OpenAI:
    global _client
    if _client is None:
        _client = OpenAI(api_key=os.environ["OPENAI_API_KEY"])
    return _client


def embed_text(text: str) -> list[float]:
    client = _get_client()
    response = client.embeddings.create(
        model="text-embedding-3-small",
        input=text,
    )
    return response.data[0].embedding


def cosine_similarity(a: list[float], b: list[float]) -> float:
    dot = sum(x * y for x, y in zip(a, b))
    mag_a = math.sqrt(sum(x * x for x in a))
    mag_b = math.sqrt(sum(x * x for x in b))
    if mag_a == 0 or mag_b == 0:
        return 0.0
    return dot / (mag_a * mag_b)


def score_annotation(annotation: RiskAnnotation) -> float:
    """Faithfulness score for an annotation.

    Primary check: is cited_text a verbatim substring of clause_text?
    If yes → 1.0 (the citation is literally present in the source).
    If no  → cosine similarity as a soft fallback (partial/paraphrased citations).
    """
    if annotation.risk_category == "None":
        return 1.0
    # Exact containment check (case-insensitive)
    if annotation.cited_text.lower().strip() in annotation.clause_text.lower():
        return 1.0
    # Soft fallback: embedding similarity
    cited_emb = embed_text(annotation.cited_text)
    clause_emb = embed_text(annotation.clause_text)
    return cosine_similarity(cited_emb, clause_emb)


def flag_low_confidence(annotation: RiskAnnotation, threshold: float = _DEFAULT_THRESHOLD) -> bool:
    return annotation.confidence < threshold


def compute_faithfulness(
    annotations: list[RiskAnnotation],
    threshold: float = _DEFAULT_THRESHOLD,
) -> float:
    """Fraction of non-None annotations whose cited_text similarity exceeds threshold."""
    flagged = [a for a in annotations if a.risk_category != "None"]
    if not flagged:
        return 1.0
    supported = sum(1 for a in flagged if score_annotation(a) >= threshold)
    return supported / len(flagged)
