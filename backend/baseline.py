"""Vanilla GPT-4o baseline — category names only, no definitions, no citation enforcement.

Measures what GPT-4o achieves without AIRA's structured prompting so the paper can
compare: vanilla baseline vs. AIRA structured pipeline vs. fine-tuned mini.

Usage:
    python -m backend.baseline

Output:
    evaluation/results/baseline_vanilla_gpt4o_{timestamp}.json
"""
from __future__ import annotations

import json
from datetime import datetime, timezone
from pathlib import Path

from openai import OpenAI

GROUND_TRUTH_PATH = Path("data/ground_truth.json")
RESULTS_DIR = Path("evaluation/results")

CATEGORIES = [
    "Ambiguity",
    "UndefinedTerm",
    "EnforcementGap",
    "ScopeConflict",
    "AuthorityConflict",
    "AIUsageLoophole",
    "CircularDefinition",
    "None",
]

# Minimal prompt: category names only. Deliberately omits definitions, citation
# enforcement, chain-of-thought, conservative flagging guidance, and JSON schema.
SYSTEM_PROMPT = (
    "You are reviewing academic integrity policy clauses for potential issues. "
    "For each clause, respond with exactly one of these labels: "
    "Ambiguity, UndefinedTerm, EnforcementGap, ScopeConflict, "
    "AuthorityConflict, AIUsageLoophole, CircularDefinition, None. "
    "Respond with only the label — no explanation."
)


def _classify_vanilla(text: str, client: OpenAI) -> str:
    resp = client.chat.completions.create(
        model="gpt-4o",
        temperature=0,
        messages=[
            {"role": "system", "content": SYSTEM_PROMPT},
            {"role": "user", "content": text},
        ],
    )
    label = resp.choices[0].message.content.strip()
    return label if label in CATEGORIES else "None"


def _precision_recall(
    true_labels: list[str], pred_labels: list[str]
) -> tuple[dict[str, float], dict[str, float]]:
    precision: dict[str, float] = {}
    recall: dict[str, float] = {}
    for cat in CATEGORIES:
        tp = sum(1 for t, p in zip(true_labels, pred_labels) if t == cat and p == cat)
        fp = sum(1 for t, p in zip(true_labels, pred_labels) if t != cat and p == cat)
        fn = sum(1 for t, p in zip(true_labels, pred_labels) if t == cat and p != cat)
        precision[cat] = tp / (tp + fp) if (tp + fp) > 0 else 0.0
        recall[cat] = tp / (tp + fn) if (tp + fn) > 0 else 0.0
    return precision, recall


def _confusion_matrix(
    true_labels: list[str], pred_labels: list[str]
) -> dict[str, dict[str, int]]:
    matrix: dict[str, dict[str, int]] = {c: {c2: 0 for c2 in CATEGORIES} for c in CATEGORIES}
    for true, pred in zip(true_labels, pred_labels):
        if true in matrix and pred in matrix:
            matrix[true][pred] += 1
    return matrix


def run_baseline() -> dict:
    with open(GROUND_TRUTH_PATH) as f:
        records = json.load(f)

    client = OpenAI()
    true_labels: list[str] = []
    pred_labels: list[str] = []
    raw: list[dict] = []

    print(f"Running vanilla GPT-4o baseline on {len(records)} clauses...")
    for i, record in enumerate(records):
        pred = _classify_vanilla(record["text"], client)
        true = record["risk_category"]
        true_labels.append(true)
        pred_labels.append(pred)
        raw.append({"text": record["text"], "true": true, "predicted": pred})
        match = "✓" if pred == true else "✗"
        print(f"  [{i+1:02d}/{len(records)}] {match}  true={true:20s}  pred={pred}")

    correct = sum(t == p for t, p in zip(true_labels, pred_labels))
    accuracy = correct / len(true_labels)
    precision, recall = _precision_recall(true_labels, pred_labels)
    matrix = _confusion_matrix(true_labels, pred_labels)

    result = {
        "model": "gpt-4o",
        "condition": "vanilla_baseline",
        "prompt_type": "minimal — category names only, no definitions, no citation requirement",
        "accuracy": round(accuracy, 4),
        "correct": correct,
        "total": len(true_labels),
        "precision_per_category": {k: round(v, 4) for k, v in precision.items()},
        "recall_per_category": {k: round(v, 4) for k, v in recall.items()},
        "confusion_matrix": matrix,
        "run_timestamp": datetime.now(timezone.utc).isoformat(),
        "raw_predictions": raw,
    }

    RESULTS_DIR.mkdir(parents=True, exist_ok=True)
    ts = datetime.now(timezone.utc).strftime("%Y%m%d_%H%M%S")
    out_path = RESULTS_DIR / f"baseline_vanilla_gpt4o_{ts}.json"
    out_path.write_text(json.dumps(result, indent=2))

    print(f"\n{'='*50}")
    print(f"Vanilla baseline accuracy: {accuracy:.1%}  ({correct}/{len(true_labels)})")
    print(f"\nPer-category recall:")
    for cat in CATEGORIES:
        p = precision[cat]
        r = recall[cat]
        print(f"  {cat:20s}  precision={p:.0%}  recall={r:.0%}")
    print(f"\nResults saved → {out_path}")
    return result


if __name__ == "__main__":
    run_baseline()
