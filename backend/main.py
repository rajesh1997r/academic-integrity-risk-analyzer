from __future__ import annotations

import json
import os
import tempfile
from contextlib import asynccontextmanager
from pathlib import Path

from dotenv import load_dotenv
from fastapi import FastAPI, File, HTTPException, UploadFile
from fastapi.middleware.cors import CORSMiddleware

load_dotenv()

from backend.alignment import compute_faithfulness, flag_low_confidence, score_annotation
from backend.classifier import classify_batch
from backend.contradiction import detect_all
from backend.embeddings import get_all_embeddings, index_loaded
from backend.ingestion import extract_clauses
from backend.models import AuditReport

CLAUSE_CAP = 200
DEMO_PATH = Path("demo_output.json")
DEMO_HARVARD_PATH = Path("demo_harvard.json")
EVAL_PATH = Path("evaluation/results")


def _compute_risk_distribution(annotations) -> dict[str, int]:
    dist: dict[str, int] = {}
    for a in annotations:
        dist[a.risk_category] = dist.get(a.risk_category, 0) + 1
    return dist


def _overall_risk_rating(flagged_ratio: float, faithfulness: float) -> str:
    if flagged_ratio > 0.4 or faithfulness < 0.5:
        return "High"
    if flagged_ratio > 0.2 or faithfulness < 0.65:
        return "Medium"
    return "Low"


def _run_pipeline(pdf_path: str, source_name: str) -> AuditReport:
    clauses = extract_clauses(pdf_path)

    if len(clauses) > CLAUSE_CAP:
        raise HTTPException(
            status_code=400,
            detail=(
                f"Document contains {len(clauses)} clauses, exceeding the {CLAUSE_CAP}-clause cap. "
                "Please upload a shorter document."
            ),
        )

    annotations = classify_batch(clauses)

    for annotation in annotations:
        sim = score_annotation(annotation)
        annotation.low_confidence_flag = sim < 0.65 or flag_low_confidence(annotation)

    faithfulness = compute_faithfulness(annotations)

    contradictions = []
    if index_loaded():
        try:
            collection_name = Path(source_name).stem.replace("-", "_").replace(" ", "_").lower()
            stored_clauses, stored_embeddings = get_all_embeddings(collection_name)
            contradictions = detect_all(stored_clauses, stored_embeddings)
        except Exception:
            pass

    flagged = [a for a in annotations if a.risk_category != "None"]
    flagged_ratio = len(flagged) / max(len(clauses), 1)

    return AuditReport(
        source_doc=source_name,
        total_clauses=len(clauses),
        flagged_count=len(flagged),
        annotations=annotations,
        contradictions=contradictions,
        faithfulness_score=round(faithfulness, 4),
        overall_risk_rating=_overall_risk_rating(flagged_ratio, faithfulness),
        risk_distribution=_compute_risk_distribution(annotations),
    )


@asynccontextmanager
async def lifespan(app: FastAPI):
    try:
        from backend.embeddings import load_index
        load_index()
    except Exception:
        pass
    yield


app = FastAPI(title="AIRA API", version="1.0.0", lifespan=lifespan)

_extra_origin = os.getenv("FRONTEND_URL", "")
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",
        "http://localhost:3000",
        "https://academic-integrity-risk-analyzer.vercel.app",
        *([_extra_origin] if _extra_origin else []),
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/health")
def health():
    return {"status": "ok", "index_loaded": index_loaded()}


@app.get("/demo")
def demo():
    if not DEMO_PATH.exists():
        raise HTTPException(
            status_code=503,
            detail="Demo data not yet generated. Run: python generate_demo.py",
        )
    with open(DEMO_PATH) as f:
        return json.load(f)


@app.get("/demo/harvard")
def demo_harvard():
    if not DEMO_HARVARD_PATH.exists():
        raise HTTPException(
            status_code=503,
            detail="Harvard demo not yet generated. Run: python generate_demo.py harvard",
        )
    with open(DEMO_HARVARD_PATH) as f:
        return json.load(f)


@app.post("/analyze")
async def analyze(file: UploadFile = File(...)):
    if not file.filename or not file.filename.lower().endswith(".pdf"):
        raise HTTPException(status_code=400, detail="Only PDF files are accepted.")

    content = await file.read()
    if len(content) > 10 * 1024 * 1024:
        raise HTTPException(status_code=400, detail="File exceeds 10MB limit.")

    with tempfile.NamedTemporaryFile(suffix=".pdf", delete=False) as tmp:
        tmp.write(content)
        tmp_path = tmp.name

    try:
        report = _run_pipeline(tmp_path, file.filename)
    finally:
        Path(tmp_path).unlink(missing_ok=True)

    return report


@app.get("/evaluation")
def evaluation():
    if not EVAL_PATH.exists():
        raise HTTPException(status_code=404, detail="No evaluation results found.")
    result_files = sorted(EVAL_PATH.glob("run_*.json"), reverse=True)
    if not result_files:
        raise HTTPException(status_code=404, detail="No evaluation results found.")
    with open(result_files[0]) as f:
        return json.load(f)
