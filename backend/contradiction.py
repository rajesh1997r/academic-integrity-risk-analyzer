from __future__ import annotations

import json
import os
import time
from itertools import combinations

from openai import OpenAI, RateLimitError

from backend.alignment import cosine_similarity
from backend.models import Clause, Contradiction

_client: OpenAI | None = None
_SIMILARITY_THRESHOLD = 0.4

_SYSTEM_PROMPT = """You are an academic policy analyst detecting contradictions between policy clauses.

Given two policy clauses from the same or different university documents, determine if they genuinely contradict each other.

A contradiction exists when:
- The same action is permitted in one clause and prohibited in another
- The same rule applies to different groups in incompatible ways
- The consequences for the same violation differ irreconcilably

A contradiction does NOT exist when:
- One clause is simply more specific than the other (specificity is not contradiction)
- The clauses apply to clearly different contexts (different programs, different years)
- One clause is an exception explicitly referenced by the other

Respond ONLY with valid JSON:
{
  "is_contradiction": <true|false>,
  "contradiction_type": "<PermissionConflict|PunishmentConflict|ScopeOverlap|PolicyGap|None>",
  "explanation": "<1-3 sentence explanation>",
  "scope_explains_conflict": <true|false>
}"""


def _get_client() -> OpenAI:
    global _client
    if _client is None:
        _client = OpenAI(api_key=os.environ["OPENAI_API_KEY"])
    return _client


def generate_candidate_pairs(
    clauses: list[Clause],
    embeddings: list[list[float]],
) -> list[tuple[Clause, Clause]]:
    """Return clause pairs sorted by similarity (highest first), above threshold."""
    candidates = []
    for (i, c1), (j, c2) in combinations(enumerate(clauses), 2):
        sim = cosine_similarity(embeddings[i], embeddings[j])
        if sim >= _SIMILARITY_THRESHOLD:
            candidates.append((sim, c1, c2))
    candidates.sort(key=lambda x: x[0], reverse=True)
    return [(c1, c2) for _, c1, c2 in candidates]


def check_contradiction(clause_a: Clause, clause_b: Clause) -> Contradiction | None:
    client = _get_client()
    user_content = (
        f"Clause A (from {clause_a.source_doc}, page {clause_a.page_num}):\n{clause_a.text}\n\n"
        f"Clause B (from {clause_b.source_doc}, page {clause_b.page_num}):\n{clause_b.text}"
    )
    for attempt in range(3):
        try:
            response = client.chat.completions.create(
                model="gpt-4o",
                temperature=0,
                response_format={"type": "json_object"},
                messages=[
                    {"role": "system", "content": _SYSTEM_PROMPT},
                    {"role": "user", "content": user_content},
                ],
            )
            break
        except RateLimitError:
            if attempt == 2:
                raise
            time.sleep(2 ** attempt)  # 1s, 2s backoff
    raw = json.loads(response.choices[0].message.content)

    if not raw.get("is_contradiction", False):
        return None
    if raw.get("scope_explains_conflict", False):
        return None

    return Contradiction(
        clause_a=clause_a,
        clause_b=clause_b,
        contradiction_type=raw.get("contradiction_type", "PolicyGap"),
        explanation=raw.get("explanation", ""),
        scope_explains_conflict=False,
    )


def detect_all(
    clauses: list[Clause],
    embeddings: list[list[float]],
    max_pairs: int = 30,
) -> list[Contradiction]:
    pairs = generate_candidate_pairs(clauses, embeddings)
    # Sort by similarity (highest first) and cap to avoid runaway API cost
    pairs = pairs[:max_pairs]
    contradictions = []
    for clause_a, clause_b in pairs:
        result = check_contradiction(clause_a, clause_b)
        if result is not None:
            contradictions.append(result)
    return contradictions
