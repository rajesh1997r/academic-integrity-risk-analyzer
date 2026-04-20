# AIRA — Claude Code Memory File
**Academic Integrity Risk Analyzer**
**Read this file before touching any code.**

---

## What This Project Is

AIRA analyzes university academic integrity policy PDFs for ambiguity, contradictions,
enforcement gaps, and AI-related loopholes. It is a structured policy auditor — not a
summarizer. Every finding must cite source text. Every output is scored for faithfulness.

This is a course final project (INFO7375 Generative AI). It must be deployed and accessible
via a public URL. A professor will open the URL and evaluate it.

---

## Stack (locked — do not change)

| Layer | Decision |
|---|---|
| LLM | OpenAI GPT-4o |
| Embeddings | OpenAI text-embedding-3-small |
| Vector Store | ChromaDB — pre-built index committed to repo |
| Backend | FastAPI — deployed to Render (free tier) |
| Frontend | React — deployed to Vercel (free tier) |
| API Key | OpenAI only — stored in Render env vars and local .env |

---

## Deployment Architecture

```
React (Vercel) — https://aira.vercel.app
      ↕  REST calls to /analyze /demo /health
FastAPI (Render) — https://aira-api.onrender.com
      ├── loads chroma_db/ on startup
      └── calls OpenAI API
```

**Cold start mitigation:** FastAPI has a `/health` endpoint. Hit it before the demo.
Render free tier sleeps after 15 min inactivity. Wake it up manually before showing the professor.

---

## Project Structure

```
aira/
├── CLAUDE.md                  ← this file
├── README.md
├── .env                       ← NEVER commit (OPENAI_API_KEY)
├── .gitignore
├── requirements.txt
│
├── backend/
│   ├── main.py                ← FastAPI app, all endpoints
│   ├── ingestion.py           ← ✅ BUILT — PDF → Clause objects
│   ├── embeddings.py          ← 🔲 next: Clause → ChromaDB
│   ├── classifier.py          ← 🔲 risk classification engine
│   ├── contradiction.py       ← 🔲 pairwise contradiction detection
│   ├── alignment.py           ← 🔲 faithfulness scoring
│   ├── synthetic.py           ← 🔲 synthetic data generation
│   ├── evaluator.py           ← 🔲 metrics computation
│   └── models.py              ← 🔲 Pydantic schemas
│
├── chroma_db/                 ← ✅ build with build_index.py, commit to repo
├── build_index.py             ← 🔲 run once locally to build ChromaDB
│
├── data/
│   ├── policies/
│   │   ├── mitt.pdf           ← MIT handbook (454 clauses, no AI language)
│   │   ├── harvard_ai.pdf     ← Harvard HUIT guidelines (29 clauses, AI language)
│   │   └── neu_integrity.pdf  ← NEU policy (66 clauses, AI language) ← BEST DOC
│   ├── ground_truth.json      ← manual annotations (human task)
│   ├── synthetic_clean.json   ← generated, human reviewed
│   └── synthetic_adversarial.json
│
├── demo_output.json           ← pre-computed NEU analysis (run once, commit)
│
├── frontend/
│   ├── package.json
│   ├── src/
│   │   ├── App.jsx
│   │   ├── components/
│   │   │   ├── Scorecard.jsx
│   │   │   ├── ClauseTable.jsx
│   │   │   ├── ContradictionView.jsx
│   │   │   ├── EvaluationDashboard.jsx
│   │   │   └── RiskHeatmap.jsx
│   │   └── views/
│   │       ├── DemoView.jsx   ← loads demo_output.json, zero API calls
│   │       └── UploadView.jsx ← live pipeline
│   └── public/
│
└── evaluation/
    └── results/
```

---

## What Is Already Built

### ingestion.py ✅
- Accepts PDF file path
- Uses pdfplumber for extraction
- Filters noise (TOC, headers, footers, nav elements)
- Splits into Clause objects (id, text, source_doc, page_num, position_index, word_count)
- Tested on: MIT (454), Harvard (29), NEU (66) clauses
- Min words filter: 8

### Clause dataclass
```python
@dataclass
class Clause:
    id: str          # UUID
    text: str
    source_doc: str
    page_num: int
    position_index: int
    word_count: int
```

---

## Risk Taxonomy (enforced in all prompts)

Every clause gets exactly ONE primary label:
- `Ambiguity` — language open to multiple interpretations
- `UndefinedTerm` — term used without definition
- `EnforcementGap` — no mechanism to detect or act on violation
- `ScopeConflict` — clause applies inconsistently across contexts
- `AuthorityConflict` — unclear who enforces
- `AIUsageLoophole` — AI use permitted or prohibited without clear boundary
- `CircularDefinition` — definition references itself
- `None` — no risk identified

Optional secondary label allowed when genuine overlap exists.

---

## API Endpoints (FastAPI — to build)

```
GET  /health              → {"status": "ok"} — wake Render from sleep
GET  /demo                → returns demo_output.json (pre-computed NEU analysis)
POST /analyze             → accepts PDF upload, returns AuditReport JSON
POST /generate-synthetic  → generates synthetic clauses (one-time use)
GET  /evaluation          → returns evaluation metrics JSON
```

---

## Frontend Views (React — to build)

**Demo View (default landing):**
- Loads from GET /demo — no upload, no API cost
- Displays: Scorecard, Clause Table, Contradiction Pairs, Risk Heatmap

**Upload View:**
- File uploader (PDF only, 10MB max)
- Progress indicator during analysis
- Same display components as Demo View
- Clause count cap: 200 (show warning if exceeded)

**Evaluation View:**
- Confusion matrix
- Faithfulness score
- Hallucination rate on adversarial set

---

## Data Flow

```
PDF → ingestion.py → List[Clause]
                          ↓
                   embeddings.py → ChromaDB
                          ↓
                   classifier.py → List[RiskAnnotation]
                          ↓
                   contradiction.py → List[Contradiction]
                          ↓
                   alignment.py → faithfulness scores
                          ↓
                   AuditReport JSON → FastAPI → React
```

---

## Key Constraints

1. **Never commit .env or OPENAI_API_KEY**
2. **ChromaDB index must be pre-built and committed** — do not re-embed at runtime
3. **Demo tab must work with zero API calls** — load from demo_output.json
4. **All GPT-4o calls use response_format: json_object** — structured output enforced
5. **Temperature 0 for all classification** — 0.7 for synthetic generation only
6. **Clause count cap: 200 per upload session** — prevents cost overrun
7. **Every finding must include cited_text** — no unsupported claims
8. **Never add Claude as co-author to git commits** — do not append `Co-Authored-By:` lines to any commit message

---

## OpenAI Output Schema (all classification calls)

```json
{
  "risk_category": "AIUsageLoophole",
  "secondary_category": "UndefinedTerm",
  "reasoning": "The clause lists AI as unauthorized without defining when it is permitted...",
  "cited_text": "artificial intelligence, chatbots, etc.",
  "confidence": 0.82
}
```

---

## Source Documents

| File | Clauses | AI Language | Notes |
|---|---|---|---|
| mitt.pdf | 454 | None (2012) | Good for volume testing |
| harvard_ai.pdf | 29 | Strong | IT-focused, has web nav noise |
| neu_integrity.pdf | 66 | Present | Best document for AIRA demo |

**NEU is the demo document.** Run the full pipeline on NEU, save output as demo_output.json.

---

## Human Tasks (Claude cannot do these)

- [ ] Manually annotate 20-35 clauses from NEU for ground truth
- [ ] Review and accept/reject each synthetic clause before it enters eval set
- [ ] Confirm adversarial cases are genuinely subtle
- [ ] Set faithfulness threshold (run calibration sweep first)
- [ ] Deploy to Render + set OPENAI_API_KEY env var
- [ ] Deploy React to Vercel
- [ ] Hit /health endpoint before demo to wake Render
- [ ] Record 10-minute video demo

---

## Evaluation Baseline

Compare AIRA against vanilla GPT-4o on the same 20 annotated clauses:

**Baseline:** "Does this clause have any policy issues? If so, what kind?"
**AIRA:** Full pipeline with taxonomy, citation, confidence scoring

Measure: classification accuracy, citation rate, silent failure detection rate.
AIRA should win. Report honestly if it doesn't.

---

## Build Order

```
1. build_index.py         → run locally, commit chroma_db/
2. backend/models.py      → Pydantic schemas
3. backend/embeddings.py  → ChromaDB load + query
4. backend/classifier.py  → risk classification
5. backend/alignment.py   → faithfulness scoring
6. backend/contradiction.py → contradiction detection
7. backend/main.py        → FastAPI endpoints wiring it all together
8. Run full pipeline on NEU → save demo_output.json
9. frontend/              → React UI
10. Deploy backend to Render
11. Deploy frontend to Vercel
12. backend/synthetic.py  → synthetic data generation
13. backend/evaluator.py  → metrics
```
