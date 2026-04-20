"""Synthetic data generation — run once, then human reviews each clause.

Usage:
    python -m backend.synthetic

Output:
    data/synthetic_clean.json
    data/synthetic_adversarial.json
"""
from __future__ import annotations

import json
import os
from pathlib import Path

from openai import OpenAI

from backend.alignment import cosine_similarity, embed_text
from backend.models import SyntheticClause

_client: OpenAI | None = None
_CLEAN_PATH = Path("data/synthetic_clean.json")
_ADVERSARIAL_PATH = Path("data/synthetic_adversarial.json")

CATEGORIES = [
    "Ambiguity",
    "UndefinedTerm",
    "EnforcementGap",
    "ScopeConflict",
    "AuthorityConflict",
    "AIUsageLoophole",
    "CircularDefinition",
]

_CLEAN_SYSTEM = """You are generating realistic university academic integrity policy clauses for testing purposes.
Each clause must:
- Sound like authentic policy language (not a textbook example)
- Clearly exhibit the requested risk category
- Be 1-3 sentences long
- Be plausible for a real university document

Respond with a JSON array of clause strings. No commentary."""

_ADVERSARIAL_SYSTEM = """You are generating subtle, adversarial academic integrity policy clauses for testing an AI classifier.
Each clause must:
- Sound entirely reasonable at first reading
- Contain a hidden risk from the requested category that is easy to miss
- Be 1-3 sentences long
- NOT obviously telegraph the risk

The goal: trick the classifier into labeling these as 'None' when they are actually risky.

Respond with a JSON array of clause strings. No commentary."""


def _get_client() -> OpenAI:
    global _client
    if _client is None:
        _client = OpenAI(api_key=os.environ["OPENAI_API_KEY"])
    return _client


def _generate(system_prompt: str, category: str, n: int) -> list[str]:
    client = _get_client()
    response = client.chat.completions.create(
        model="gpt-4o",
        temperature=0.7,
        response_format={"type": "json_object"},
        messages=[
            {"role": "system", "content": system_prompt},
            {"role": "user", "content": f"Generate {n} clauses for category: {category}. Return JSON: {{\"clauses\": [...]}}"},
        ],
    )
    raw = json.loads(response.choices[0].message.content)
    return raw.get("clauses", [])


def diversity_filter(new_clause: str, existing: list[str], threshold: float = 0.85) -> bool:
    """Return True if new_clause is sufficiently different from all existing clauses."""
    if not existing:
        return True
    new_emb = embed_text(new_clause)
    for ex in existing:
        ex_emb = embed_text(ex)
        if cosine_similarity(new_emb, ex_emb) >= threshold:
            return False
    return True


def generate_clean_clauses(category: str, n: int = 5) -> list[SyntheticClause]:
    texts = _generate(_CLEAN_SYSTEM, category, n)
    return [
        SyntheticClause(text=t, category=category, is_adversarial=False, human_accepted=False)
        for t in texts
    ]


def generate_adversarial_clauses(category: str, n: int = 3) -> list[SyntheticClause]:
    texts = _generate(_ADVERSARIAL_SYSTEM, category, n)
    return [
        SyntheticClause(text=t, category=category, is_adversarial=True, human_accepted=False)
        for t in texts
    ]


def run_generation() -> None:
    Path("data").mkdir(exist_ok=True)
    clean: list[dict] = []
    adversarial: list[dict] = []

    for category in CATEGORIES:
        print(f"Generating clean clauses for {category}...")
        clauses = generate_clean_clauses(category, n=5)
        for c in clauses:
            if diversity_filter(c.text, [x["text"] for x in clean]):
                clean.append(c.model_dump())

        print(f"Generating adversarial clauses for {category}...")
        adv_clauses = generate_adversarial_clauses(category, n=3)
        for c in adv_clauses:
            if diversity_filter(c.text, [x["text"] for x in adversarial]):
                adversarial.append(c.model_dump())

    _CLEAN_PATH.write_text(json.dumps(clean, indent=2))
    _ADVERSARIAL_PATH.write_text(json.dumps(adversarial, indent=2))

    print(f"\nGenerated {len(clean)} clean clauses → {_CLEAN_PATH}")
    print(f"Generated {len(adversarial)} adversarial clauses → {_ADVERSARIAL_PATH}")
    print("\nNEXT: Open both files and set human_accepted=true for each clause you accept.")


if __name__ == "__main__":
    run_generation()
