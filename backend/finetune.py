"""
Fine-tuning pipeline for AIRA risk classifier.

Trains gpt-4o-mini-2024-07-18 on human-annotated ground truth
plus clean synthetic clauses, producing a cheaper, faster classifier.

Usage:
    python -m backend.finetune --prepare   # build JSONL, print stats (free)
    python -m backend.finetune --submit    # upload + start OpenAI job (~$0.50)
    python -m backend.finetune --status    # poll current job status
    python -m backend.finetune --compare   # compare fine-tuned vs GPT-4o base
"""
from __future__ import annotations

import argparse
import json
import os
import random
import re
import uuid
from collections import Counter
from pathlib import Path

from dotenv import load_dotenv

load_dotenv()

from backend.classifier import VALID_CATEGORIES, _SYSTEM_PROMPT
from backend.models import Clause

_GT_PATH = Path("data/ground_truth.json")
_SYNTHETIC_PATH = Path("data/synthetic_clean.json")
_TRAIN_JSONL = Path("data/finetune_train.jsonl")
_VAL_JSONL = Path("data/finetune_val.jsonl")
_JOB_META = Path("data/finetune_job.json")
_COMPARE_PATH = Path("data/finetune_comparison.json")

BASE_MODEL = "gpt-4o-mini-2024-07-18"
RANDOM_SEED = 42

_REASONING_TEMPLATES = {
    "Ambiguity": (
        'The phrase "{cited}" is open to contradictory interpretations — a student could '
        "argue compliance while an instructor could find a violation, creating a real enforcement dilemma."
    ),
    "UndefinedTerm": (
        'The term "{cited}" is used as a threshold for the rule\'s application but is never '
        "defined, leaving students unable to determine what constitutes compliance in practice."
    ),
    "EnforcementGap": (
        'The clause prohibits "{cited}" but specifies no mechanism to detect, investigate, '
        "or act on such a violation — the prohibition is unenforceable."
    ),
    "ScopeConflict": (
        'The clause applies to "{cited}" in a way that creates an exploitable inconsistency '
        "across different student populations or course contexts."
    ),
    "AuthorityConflict": (
        '"{cited}" references enforcement authority without establishing a clear decision '
        "hierarchy, leaving it ambiguous who has final say over a violation."
    ),
    "AIUsageLoophole": (
        'The clause addresses "{cited}" but leaves a clear exploitable gap — the boundary '
        "of what counts as prohibited AI use is undefined."
    ),
    "CircularDefinition": (
        'The definition uses "{cited}" to define itself, providing no real constraint — '
        "a student reading this clause gains no actionable guidance."
    ),
    "None": (
        "This clause states standard academic policy without genuine ambiguity, undefined "
        "terms, or enforcement gaps that would affect student fairness."
    ),
}


def _extract_cited_text(text: str, category: str) -> str:
    if category == "None":
        return ""
    match = re.search(r"[.!?]", text)
    if match and match.start() > 15:
        return text[: match.start() + 1].strip()
    return text[:120].strip()


def _make_example(text: str, category: str, confidence: float = 0.88) -> dict:
    cited = _extract_cited_text(text, category)
    reasoning = _REASONING_TEMPLATES.get(category, _REASONING_TEMPLATES["None"]).format(
        cited=cited or text[:60]
    )
    assistant_payload = {
        "risk_category": category,
        "secondary_category": None,
        "reasoning": reasoning,
        "cited_text": cited,
        "confidence": confidence,
    }
    return {
        "messages": [
            {"role": "system", "content": _SYSTEM_PROMPT},
            {"role": "user", "content": f"Policy clause:\n\n{text}"},
            {"role": "assistant", "content": json.dumps(assistant_payload)},
        ]
    }


def prepare_training_data() -> tuple[list[dict], list[dict]]:
    """
    Load ground truth + clean synthetic clauses, shuffle, split 80/20.
    Writes data/finetune_train.jsonl and data/finetune_val.jsonl.
    Returns (train_examples, val_examples).
    """
    examples: list[dict] = []

    if _GT_PATH.exists():
        gt = json.loads(_GT_PATH.read_text())
        for entry in gt:
            text = entry.get("text", "").strip()
            category = entry.get("risk_category", "None")
            if not text or category not in VALID_CATEGORIES:
                continue
            if len(text.split()) < 8:
                continue
            examples.append(_make_example(text, category, confidence=0.92))

    if _SYNTHETIC_PATH.exists():
        synthetic = json.loads(_SYNTHETIC_PATH.read_text())
        for entry in synthetic:
            text = entry.get("text", "").strip()
            category = entry.get("category", "None")
            if not text or category not in VALID_CATEGORIES or category == "None":
                continue
            examples.append(_make_example(text, category, confidence=0.85))

    random.seed(RANDOM_SEED)
    random.shuffle(examples)

    split = int(len(examples) * 0.8)
    train, val = examples[:split], examples[split:]

    _TRAIN_JSONL.write_text("\n".join(json.dumps(e) for e in train))
    _VAL_JSONL.write_text("\n".join(json.dumps(e) for e in val))

    print(f"Total examples     : {len(examples)}")
    print(f"Training examples  : {len(train)}")
    print(f"Validation examples: {len(val)}")
    print(f"Train JSONL        : {_TRAIN_JSONL}")
    print(f"Val JSONL          : {_VAL_JSONL}")

    dist = Counter(
        json.loads(e["messages"][-1]["content"])["risk_category"] for e in train
    )
    print("\nCategory distribution (train):")
    for cat, count in sorted(dist.items()):
        print(f"  {cat:25s}: {count}")

    return train, val


def upload_and_submit() -> str:
    """Prepare data, upload to OpenAI, start fine-tuning job. Returns job_id."""
    from openai import OpenAI

    train, val = prepare_training_data()
    if len(train) < 10:
        raise ValueError(f"Need at least 10 training examples, got {len(train)}")

    client = OpenAI(api_key=os.environ["OPENAI_API_KEY"])

    print("\nUploading training file...")
    with open(_TRAIN_JSONL, "rb") as f:
        train_file = client.files.create(file=f, purpose="fine-tune")
    print(f"Training file ID  : {train_file.id}")

    print("Uploading validation file...")
    with open(_VAL_JSONL, "rb") as f:
        val_file = client.files.create(file=f, purpose="fine-tune")
    print(f"Validation file ID: {val_file.id}")

    print(f"\nStarting fine-tuning job on {BASE_MODEL}...")
    job = client.fine_tuning.jobs.create(
        training_file=train_file.id,
        validation_file=val_file.id,
        model=BASE_MODEL,
        hyperparameters={"n_epochs": 3},
        suffix="aira",
    )

    meta = {
        "job_id": job.id,
        "base_model": BASE_MODEL,
        "status": job.status,
        "training_file": train_file.id,
        "validation_file": val_file.id,
        "training_examples": len(train),
        "validation_examples": len(val),
        "fine_tuned_model": None,
    }
    _JOB_META.write_text(json.dumps(meta, indent=2))

    print(f"Job ID     : {job.id}")
    print(f"Status     : {job.status}")
    print(f"\nEstimated time: 30-60 minutes")
    print(f"Check status : python -m backend.finetune --status")
    return job.id


def check_status() -> dict:
    """Poll OpenAI for current job status, update finetune_job.json."""
    from openai import OpenAI

    if not _JOB_META.exists():
        raise FileNotFoundError("No job found. Run --submit first.")
    meta = json.loads(_JOB_META.read_text())
    job_id = meta["job_id"]

    client = OpenAI(api_key=os.environ["OPENAI_API_KEY"])
    job = client.fine_tuning.jobs.retrieve(job_id)

    meta["status"] = job.status
    if job.fine_tuned_model:
        meta["fine_tuned_model"] = job.fine_tuned_model
    if job.trained_tokens:
        meta["trained_tokens"] = job.trained_tokens
    if job.finished_at:
        meta["finished_at"] = job.finished_at

    _JOB_META.write_text(json.dumps(meta, indent=2))

    print(f"Job ID           : {job_id}")
    print(f"Status           : {job.status}")
    if job.fine_tuned_model:
        print(f"Fine-tuned model : {job.fine_tuned_model}")
    if job.trained_tokens:
        print(f"Trained tokens   : {job.trained_tokens:,}")

    return meta


def compare_models() -> dict:
    """
    Evaluate both GPT-4o and the fine-tuned model on ground truth.
    Saves results to data/finetune_comparison.json.
    """
    from backend.classifier import classify_clause

    if not _JOB_META.exists():
        raise FileNotFoundError("No job found. Run --submit first.")
    meta = json.loads(_JOB_META.read_text())
    ft_model = meta.get("fine_tuned_model")
    if not ft_model:
        raise ValueError(f"Fine-tuned model not ready. Status: {meta.get('status')}")

    if not _GT_PATH.exists():
        raise FileNotFoundError("data/ground_truth.json not found.")
    gt = json.loads(_GT_PATH.read_text())

    test_clauses = [
        Clause(
            id=str(uuid.uuid4()),
            text=e["text"],
            source_doc=e.get("source_doc", "ground_truth"),
            page_num=e.get("page_num", 0),
            position_index=i,
            word_count=len(e["text"].split()),
        )
        for i, e in enumerate(gt)
        if len(e.get("text", "").split()) >= 8
    ]
    true_labels = [
        e["risk_category"] for e in gt if len(e.get("text", "").split()) >= 8
    ]
    n = len(test_clauses)

    print(f"Evaluating GPT-4o base on {n} clauses...")
    base_preds = [classify_clause(c, model="gpt-4o") for c in test_clauses]
    base_correct = sum(a.risk_category == t for a, t in zip(base_preds, true_labels))

    print(f"Evaluating fine-tuned model on {n} clauses...")
    ft_preds = [classify_clause(c, model=ft_model) for c in test_clauses]
    ft_correct = sum(a.risk_category == t for a, t in zip(ft_preds, true_labels))

    result = {
        "base_model": {
            "name": "gpt-4o",
            "accuracy": round(base_correct / n, 4),
            "correct": base_correct,
            "total": n,
        },
        "finetuned_model": {
            "name": ft_model,
            "base": BASE_MODEL,
            "accuracy": round(ft_correct / n, 4),
            "correct": ft_correct,
            "total": n,
        },
        "accuracy_delta": round((ft_correct - base_correct) / n, 4),
        "training_examples": meta.get("training_examples"),
        "note": (
            "Fine-tuned gpt-4o-mini is faster and ~20x cheaper per token. "
            "Accuracy delta measures the cost of the cheaper model."
        ),
    }
    _COMPARE_PATH.write_text(json.dumps(result, indent=2))

    print(f"\nBase model (gpt-4o)    : {base_correct}/{n} = {base_correct/n:.1%}")
    print(f"Fine-tuned (gpt-4o-mini): {ft_correct}/{n} = {ft_correct/n:.1%}")
    print(f"Delta                  : {result['accuracy_delta']:+.4f}")
    return result


def load_status() -> dict | None:
    """Return job metadata dict, or None if no job exists."""
    if not _JOB_META.exists():
        return None
    return json.loads(_JOB_META.read_text())


def load_comparison() -> dict | None:
    """Return comparison results dict, or None if not yet run."""
    if not _COMPARE_PATH.exists():
        return None
    return json.loads(_COMPARE_PATH.read_text())


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="AIRA fine-tuning pipeline")
    group = parser.add_mutually_exclusive_group(required=True)
    group.add_argument("--prepare", action="store_true", help="Build JSONL (free)")
    group.add_argument("--submit", action="store_true", help="Upload + start job")
    group.add_argument("--status", action="store_true", help="Check job status")
    group.add_argument("--compare", action="store_true", help="Compare models")
    args = parser.parse_args()

    if args.prepare:
        prepare_training_data()
    elif args.submit:
        upload_and_submit()
    elif args.status:
        check_status()
    elif args.compare:
        compare_models()
