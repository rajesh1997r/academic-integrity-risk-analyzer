"""Evaluation pipeline — run after human annotations are in data/ground_truth.json.

Usage:
    python -m backend.evaluator

Output:
    evaluation/results/run_{timestamp}.json
"""
from __future__ import annotations

import json
from datetime import datetime, timezone
from pathlib import Path

from backend.classifier import classify_clause
from backend.ingestion import extract_clauses
from backend.models import Clause, EvaluationResult
from backend.alignment import compute_faithfulness

GROUND_TRUTH_PATH = Path("data/ground_truth.json")
ADVERSARIAL_PATH = Path("data/synthetic_adversarial.json")
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


def load_ground_truth() -> list[dict]:
    """Load manually annotated clauses.

    Expected format:
    [{"text": "...", "source_doc": "...", "page_num": 1, "risk_category": "Ambiguity"}, ...]
    """
    if not GROUND_TRUTH_PATH.exists():
        raise FileNotFoundError(
            f"{GROUND_TRUTH_PATH} not found. "
            "Manually annotate 20-35 NEU clauses and save them there first."
        )
    with open(GROUND_TRUTH_PATH) as f:
        return json.load(f)


def _build_confusion_matrix(
    true_labels: list[str], pred_labels: list[str]
) -> dict[str, dict[str, int]]:
    matrix: dict[str, dict[str, int]] = {c: {c2: 0 for c2 in CATEGORIES} for c in CATEGORIES}
    for true, pred in zip(true_labels, pred_labels):
        if true in matrix and pred in matrix:
            matrix[true][pred] += 1
    return matrix


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


def hallucination_rate(adversarial_set: list[dict]) -> float:
    """Fraction of adversarial clauses the classifier correctly flags (should not label as None)."""
    accepted = [r for r in adversarial_set if r.get("human_accepted", False)]
    if not accepted:
        return 0.0
    import uuid
    detected = 0
    for record in accepted:
        clause = Clause(
            id=str(uuid.uuid4()),
            text=record["text"],
            source_doc="synthetic",
            page_num=0,
            position_index=0,
            word_count=len(record["text"].split()),
        )
        annotation = classify_clause(clause)
        if annotation.risk_category != "None":
            detected += 1
    # Hallucination rate = fraction classifier *missed* (labeled None when it shouldn't)
    return 1.0 - (detected / len(accepted))


def run_evaluation() -> EvaluationResult:
    records = load_ground_truth()
    import uuid

    true_labels = []
    pred_labels = []
    annotations = []

    print(f"Running evaluation on {len(records)} annotated clauses...")
    for record in records:
        clause = Clause(
            id=str(uuid.uuid4()),
            text=record["text"],
            source_doc=record.get("source_doc", "ground_truth"),
            page_num=record.get("page_num", 0),
            position_index=0,
            word_count=len(record["text"].split()),
        )
        annotation = classify_clause(clause)
        true_labels.append(record["risk_category"])
        pred_labels.append(annotation.risk_category)
        annotations.append(annotation)

    accuracy = sum(1 for t, p in zip(true_labels, pred_labels) if t == p) / len(true_labels)
    confusion = _build_confusion_matrix(true_labels, pred_labels)
    precision, recall = _precision_recall(true_labels, pred_labels)
    faithfulness = compute_faithfulness(annotations)

    hall_rate = 0.0
    if ADVERSARIAL_PATH.exists():
        with open(ADVERSARIAL_PATH) as f:
            adversarial = json.load(f)
        print("Computing hallucination rate on adversarial set...")
        hall_rate = hallucination_rate(adversarial)

    result = EvaluationResult(
        accuracy=round(accuracy, 4),
        precision_per_category=precision,
        recall_per_category=recall,
        confusion_matrix=confusion,
        faithfulness_score=round(faithfulness, 4),
        hallucination_rate=round(hall_rate, 4),
        run_timestamp=datetime.now(timezone.utc).isoformat(),
    )

    RESULTS_DIR.mkdir(parents=True, exist_ok=True)
    ts = datetime.now(timezone.utc).strftime("%Y%m%d_%H%M%S")
    out_path = RESULTS_DIR / f"run_{ts}.json"
    out_path.write_text(json.dumps(result.model_dump(), indent=2))
    print(f"\nResults saved to {out_path}")
    print(f"Accuracy: {accuracy:.1%}  Faithfulness: {faithfulness:.2f}  Hallucination rate: {hall_rate:.1%}")

    return result


if __name__ == "__main__":
    run_evaluation()
