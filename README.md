# AIRA — Academic Integrity Risk Analyzer

Audits university academic integrity policy PDFs for ambiguity, contradictions, enforcement gaps, and AI-related loopholes using GPT-4o, ChromaDB RAG, and grounded faithfulness scoring.

Built for **INFO 7375 Generative AI Engineering** · Northeastern University · Spring 2026

**Live:** https://academic-integrity-risk-analyzer.vercel.app

---

## Results

| Metric | Score |
|---|---|
| Classification accuracy | **90.2%** (51-clause NEU ground truth) |
| Faithfulness | **100%** — every cited_text is a verbatim substring of its clause |
| Hallucination rate | **0.0%** — no adversarial clauses mislabeled as None |
| AIUsageLoophole | **100% precision / 100% recall** |
| EnforcementGap | **100% precision / 87.5% recall** |

---

## Architecture

```
PDF → ingestion.py → List[Clause]
                          │
                  text-embedding-3-small
                          │
                      ChromaDB ──── pre-built, committed to repo
                          │
                   classifier.py ─── GPT-4o, temp=0, json_object
                          │
                   alignment.py ──── containment-first faithfulness
                          │
               contradiction.py ──── cosine sim > 0.4 pairs
                          │
                    AuditReport JSON
                          │
         FastAPI (Render) ──REST──▶ React (Vercel)
```

---

## Local Setup

### Prerequisites
- Python 3.11+
- Node 20+
- OpenAI API key

### Backend

```bash
python -m venv .venv && source .venv/bin/activate
pip install -r requirements.txt
cp .env.example .env        # add OPENAI_API_KEY=sk-...
```

PDFs used (place in `data/policies/`):

| File | Clauses | Notes |
|---|---|---|
| `neu_academic_integrity.pdf.pdf` | 51 | Demo document |
| `harvard_ai_guidelines.pdf.pdf` | 16 | AI-focused |
| `mit_handbook.pdf.pdf` | 385 | Volume testing |

**Build ChromaDB index** (run once, commit `chroma_db/`):
```bash
python build_index.py
```

**Start the API:**
```bash
uvicorn backend.main:app --reload
# http://localhost:8000
```

**Pre-compute demo outputs:**
```bash
python generate_demo.py           # NEU → demo_output.json
python generate_demo.py harvard   # Harvard → demo_harvard.json
```

### Frontend

```bash
cd frontend
npm install
npm run dev
# http://localhost:5173
```

Set `VITE_API_URL=http://localhost:8000` in `frontend/.env.local`.

### Tests

```bash
pytest tests/ -v
```

Tests use `unittest.mock` to patch `_get_client` — no API key or PDFs needed for CI.

---

## Evaluation

**Ground truth annotation** (done — `data/ground_truth.json`, 51 NEU clauses):
```bash
python -m backend.evaluator
# Results → evaluation/results/run_<timestamp>.json
# Served at GET /evaluation
```

**Synthetic data** (35 clean + 21 adversarial clauses):
```bash
python -m backend.synthetic
# Review data/synthetic_clean.json and data/synthetic_adversarial.json
# Set "human_accepted": true for clauses you approve
```

---

## API Endpoints

| Endpoint | Description |
|---|---|
| `GET /health` | Liveness check — wake Render before demo |
| `GET /demo` | Pre-computed NEU analysis (no API cost) |
| `GET /demo/harvard` | Pre-computed Harvard analysis (no API cost) |
| `POST /analyze` | Upload PDF → AuditReport (200-clause cap) |
| `GET /evaluation` | Latest evaluation metrics JSON |

---

## Deployment

### Render (backend)
1. Connect GitHub repo on [render.com](https://render.com)
2. Start command: `uvicorn backend.main:app --host 0.0.0.0 --port $PORT`
3. Python version: set `PYTHON_VERSION=3.11.0` in env vars
4. Add `OPENAI_API_KEY` in env vars

### Vercel (frontend)
1. Import repo on [vercel.com](https://vercel.com), set root directory to `frontend/`
2. Add env var: `VITE_API_URL=https://your-render-url.onrender.com`

**Before demo:** Hit `/health` at least 60 seconds before presenting — Render free tier sleeps after 15 min inactivity.

---

## Risk Taxonomy

| Category | Description |
|---|---|
| `Ambiguity` | Language open to multiple interpretations |
| `UndefinedTerm` | Key term used without definition |
| `EnforcementGap` | No mechanism to detect or act on violation |
| `ScopeConflict` | Clause applies inconsistently across contexts |
| `AuthorityConflict` | Unclear who has enforcement authority |
| `AIUsageLoophole` | AI use permitted/prohibited without clear boundary |
| `CircularDefinition` | Definition references itself |
| `None` | No risk identified |
