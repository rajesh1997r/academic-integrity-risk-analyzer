# AIRA — Academic Integrity Risk Analyzer

Analyzes university academic integrity policy PDFs for ambiguity, contradictions, enforcement gaps, and AI-related loopholes. Built for INFO 7375 Generative AI (NEU).

**Live demo:** https://aira.vercel.app

---

## Architecture

```
React (Vercel) ──REST──▶ FastAPI (Render)
                              ├── ChromaDB (pre-built index)
                              └── OpenAI GPT-4o + text-embedding-3-small
```

---

## Local Setup

### Prerequisites
- Python 3.11+
- Node 20+
- An OpenAI API key

### Backend

```bash
python -m venv .venv && source .venv/bin/activate
pip install -r requirements.txt
cp .env.example .env        # add your OPENAI_API_KEY
```

**Upload PDFs** to `data/policies/`:
- `mitt.pdf` — MIT Handbook
- `harvard_ai.pdf` — Harvard HUIT Guidelines
- `neu_integrity.pdf` — NEU Academic Integrity Policy

**Build ChromaDB index** (run once, then commit `chroma_db/`):
```bash
python build_index.py
```

**Start the API:**
```bash
uvicorn backend.main:app --reload
# API at http://localhost:8000
```

**Pre-compute demo output** (run the pipeline on NEU, save result):
```bash
python -c "
import json
from backend.ingestion import extract_clauses
from backend.classifier import classify_batch
from backend.alignment import compute_faithfulness, score_annotation, flag_low_confidence
from backend.models import AuditReport

clauses = extract_clauses('data/policies/neu_academic_integrity.pdf.pdf')
annotations = classify_batch(clauses)
for a in annotations:
    from backend.alignment import score_annotation, flag_low_confidence
    sim = score_annotation(a)
    a.low_confidence_flag = sim < 0.65 or flag_low_confidence(a)
faithfulness = compute_faithfulness(annotations)
flagged = [a for a in annotations if a.risk_category != 'None']
dist = {}
for a in annotations:
    dist[a.risk_category] = dist.get(a.risk_category, 0) + 1
report = AuditReport(
    source_doc='neu_integrity.pdf',
    total_clauses=len(clauses),
    flagged_count=len(flagged),
    annotations=annotations,
    contradictions=[],
    faithfulness_score=round(faithfulness, 4),
    overall_risk_rating='High' if len(flagged)/len(clauses) > 0.4 else 'Medium',
    risk_distribution=dist,
)
with open('demo_output.json', 'w') as f:
    json.dump(report.model_dump(), f, indent=2)
print('Saved demo_output.json')
"
```

### Frontend

```bash
cd frontend
cp .env.example .env.local   # VITE_API_URL=http://localhost:8000
npm install
npm run dev
# App at http://localhost:5173
```

---

## Evaluation

1. Manually annotate 20–35 NEU clauses and save to `data/ground_truth.json`:
   ```json
   [{"text": "...", "source_doc": "neu_integrity.pdf", "page_num": 3, "risk_category": "Ambiguity"}]
   ```
2. Run the evaluator:
   ```bash
   python -m backend.evaluator
   ```
3. Results saved to `evaluation/results/run_<timestamp>.json` and served at `GET /evaluation`.

### Synthetic Data

```bash
python -m backend.synthetic
# Review data/synthetic_clean.json and data/synthetic_adversarial.json
# Set "human_accepted": true for clauses you accept
```

---

## Deployment

### Render (backend)
1. Push repo to GitHub
2. Create a new Web Service on [render.com](https://render.com) pointing at the repo
3. Set `OPENAI_API_KEY` in Render environment variables
4. Render will use `render.yaml` automatically

### Vercel (frontend)
1. Import the repo on [vercel.com](https://vercel.com), set root to `frontend/`
2. Set `VITE_API_URL` to your Render service URL
3. Deploy

**Pre-demo:** Hit `GET /health` at least 5 minutes before the demo to wake Render from sleep.

---

## Risk Taxonomy

| Category | Meaning |
|---|---|
| Ambiguity | Language open to multiple interpretations |
| UndefinedTerm | Key term used without definition |
| EnforcementGap | No mechanism to detect or act on violation |
| ScopeConflict | Clause applies inconsistently across contexts |
| AuthorityConflict | Unclear who has enforcement authority |
| AIUsageLoophole | AI use permitted/prohibited without clear boundary |
| CircularDefinition | Definition references itself |
| None | No risk identified |
