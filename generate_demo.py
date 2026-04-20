"""Generate demo_output.json by running the full pipeline on a policy PDF.

Usage:
    python generate_demo.py                          # defaults to NEU
    python generate_demo.py harvard                  # Harvard AI guidelines

Costs ~$0.05 in OpenAI API calls. Run once, commit demo_output.json.
"""
from __future__ import annotations

import json
import sys
from dotenv import load_dotenv

load_dotenv()

from backend.ingestion import extract_clauses
from backend.classifier import classify_batch
from backend.alignment import compute_faithfulness, score_annotation, flag_low_confidence
from backend.contradiction import detect_all
from backend.embeddings import get_all_embeddings
from backend.models import AuditReport

TARGETS = {
    "neu": {
        "pdf": "data/policies/neu_academic_integrity.pdf.pdf",
        "collection": "neu_integrity",
        "output": "demo_output.json",
    },
    "harvard": {
        "pdf": "data/policies/harvard_ai_guidelines.pdf.pdf",
        "collection": "harvard_ai",
        "output": "demo_harvard.json",
    },
}


def main(target_key: str = "neu") -> None:
    target = TARGETS[target_key]
    pdf_path = target["pdf"]
    collection = target["collection"]
    output_path = target["output"]

    print(f"Extracting clauses from {pdf_path}...")
    clauses = extract_clauses(pdf_path)
    print(f"{len(clauses)} clauses extracted")

    print("Classifying with GPT-4o (1-2 minutes)...")
    annotations = classify_batch(clauses)

    print("Scoring faithfulness...")
    for annotation in annotations:
        sim = score_annotation(annotation)
        annotation.low_confidence_flag = sim < 0.65 or flag_low_confidence(annotation)

    faithfulness = compute_faithfulness(annotations)

    print("Detecting contradictions...")
    contradictions = []
    try:
        stored_clauses, stored_embeddings = get_all_embeddings(collection)
        contradictions = detect_all(stored_clauses, stored_embeddings)
        print(f"  {len(contradictions)} contradictions found")
    except Exception as e:
        print(f"  Contradiction detection skipped: {e}")

    flagged = [a for a in annotations if a.risk_category != "None"]
    ratio = len(flagged) / max(len(clauses), 1)

    dist: dict[str, int] = {}
    for a in annotations:
        dist[a.risk_category] = dist.get(a.risk_category, 0) + 1

    report = AuditReport(
        source_doc=pdf_path.split("/")[-1],
        total_clauses=len(clauses),
        flagged_count=len(flagged),
        annotations=annotations,
        contradictions=contradictions,
        faithfulness_score=round(faithfulness, 4),
        overall_risk_rating="High" if ratio > 0.4 else "Medium" if ratio > 0.2 else "Low",
        risk_distribution=dist,
    )

    with open(output_path, "w") as f:
        json.dump(report.model_dump(), f, indent=2)

    print(f"\nSaved {output_path}")
    print(f"  Clauses:      {len(clauses)} total, {len(flagged)} flagged ({ratio:.0%})")
    print(f"  Faithfulness: {faithfulness:.2f}")
    print(f"  Overall risk: {report.overall_risk_rating}")
    print(f"  Contradictions: {len(contradictions)}")
    print(f"  Risk dist:    {dist}")


if __name__ == "__main__":
    key = sys.argv[1] if len(sys.argv) > 1 else "neu"
    if key not in TARGETS:
        print(f"Unknown target '{key}'. Choose: {list(TARGETS.keys())}")
        sys.exit(1)
    main(key)
