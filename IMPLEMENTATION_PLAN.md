# AIRA — Implementation Plan
**Detailed task breakdown by phase**

---

## Phase 1 — Foundation ✅ COMPLETE

### 1.1 PDF Ingestion & Clause Segmentation ✅
- [x] Install pdfplumber
- [x] Write ingestion.py
- [x] Noise filter (TOC, headers, footers, nav elements)
- [x] Sentence boundary splitting
- [x] Clause dataclass (id, text, source_doc, page_num, position_index, word_count)
- [x] Test on MIT PDF → 454 clauses
- [x] Test on Harvard PDF → 29 clauses
- [x] Test on NEU PDF → 66 clauses
- [x] Human spot-check: segmentation quality confirmed

---

## Phase 2 — Embedding Pipeline

### 2.1 build_index.py (run locally once)
- [ ] Load all 3 PDFs through ingestion.py
- [ ] Batch embed via OpenAI text-embedding-3-small (batch size 100)
- [ ] Create ChromaDB PersistentClient at ./chroma_db
- [ ] One collection per document (slug of filename)
- [ ] Upsert: ids, embeddings, documents (text), metadatas (source_doc, page_num, position_index)
- [ ] Verify: semantic query returns relevant clause
- [ ] Commit chroma_db/ to repo

### 2.2 backend/embeddings.py
- [ ] load_index() → returns ChromaDB client
- [ ] query_similar(text, collection_name, k=5) → List[Clause]
- [ ] get_all_clauses(collection_name) → List[Clause]

---

## Phase 3 — Core Intelligence

### 3.1 backend/models.py (Pydantic schemas)
- [ ] Clause model
- [ ] RiskAnnotation model
- [ ] Contradiction model
- [ ] AuditReport model (wraps everything)
- [ ] SyntheticClause model
- [ ] EvaluationResult model

### 3.2 backend/classifier.py
- [ ] System prompt: taxonomy definition + output schema
- [ ] Chain-of-thought instruction (reasoning before label)
- [ ] Citation enforcement (cited_text required)
- [ ] classify_clause(clause_text) → RiskAnnotation
- [ ] classify_batch(clauses) → List[RiskAnnotation]
- [ ] Handle None path (no risk found)
- [ ] Temperature: 0
- [ ] response_format: json_object

### 3.3 backend/alignment.py
- [ ] embed_text(text) → List[float]
- [ ] cosine_similarity(a, b) → float
- [ ] score_annotation(annotation) → float
- [ ] flag_low_confidence(annotation, threshold) → bool
- [ ] compute_faithfulness(annotations) → float (supported/total)
- [ ] NOTE: threshold is a parameter — calibrate after annotating ground truth

### 3.4 backend/contradiction.py
- [ ] generate_candidate_pairs(clauses, embeddings) → List[Tuple[Clause, Clause]]
  - Only pairs with cosine similarity > 0.4
- [ ] System prompt: contradiction detection with scope reasoning
- [ ] check_contradiction(clause_a, clause_b) → Contradiction | None
- [ ] Only flag if scope_explains_conflict = False
- [ ] detect_all(clauses) → List[Contradiction]

---

## Phase 4 — FastAPI Backend

### 4.1 backend/main.py
- [ ] GET /health → {"status": "ok", "index_loaded": bool}
- [ ] GET /demo → load and return demo_output.json
- [ ] POST /analyze
  - Accept multipart PDF upload
  - Run ingestion → classify → align → contradict
  - Return AuditReport JSON
  - Enforce 200 clause cap (return 400 if exceeded with message)
- [ ] CORS configured for Vercel frontend URL
- [ ] requirements.txt: fastapi, uvicorn, pdfplumber, chromadb, openai, python-multipart

### 4.2 Pre-compute demo
- [ ] Run full pipeline on NEU PDF
- [ ] Save output as demo_output.json
- [ ] Commit to repo root

---

## Phase 5 — React Frontend

### 5.1 Setup
- [ ] Create React app (Vite)
- [ ] Install: axios, recharts (charts), tailwindcss
- [ ] Configure Tailwind
- [ ] Set VITE_API_URL in .env (points to Render URL in prod, localhost in dev)

### 5.2 Components
- [ ] Scorecard.jsx
  - Total clauses, issues found, risk breakdown
  - Overall risk rating (Low/Medium/High) with color
  - Faithfulness score with progress bar
- [ ] ClauseTable.jsx
  - One row per flagged clause
  - Columns: clause text, risk label (colored badge), confidence, low-confidence warning
  - Expandable row shows full reasoning and cited text
- [ ] ContradictionView.jsx
  - Side-by-side clause A vs clause B
  - Contradiction type badge
  - Scope reasoning explanation
- [ ] RiskHeatmap.jsx
  - Bar chart of risk category distribution (recharts)
- [ ] EvaluationDashboard.jsx
  - Confusion matrix table
  - Faithfulness score
  - Hallucination rate

### 5.3 Views
- [ ] DemoView.jsx
  - On mount: fetch GET /demo
  - Show loading state
  - Render all components with pre-computed data
  - Banner: "Demo analysis of Northeastern University Academic Integrity Policy"
- [ ] UploadView.jsx
  - File drag-and-drop (PDF only, 10MB max)
  - Progress indicator during analysis
  - POST /analyze with FormData
  - Render same components on result
  - Error state for clause cap exceeded

### 5.4 App.jsx
- [ ] Tab navigation: Demo | Upload | Evaluation | About
- [ ] About tab: methodology, limitations, known failure modes

---

## Phase 6 — Synthetic Data & Evaluation

### 6.1 backend/synthetic.py
- [ ] generate_clean_clauses(category, n=5) → List[SyntheticClause]
- [ ] generate_adversarial_clauses(category, n=3) → List[SyntheticClause]
- [ ] diversity_filter(new_clause, existing_clauses, threshold=0.85) → bool
- [ ] run_generation() → saves synthetic_clean.json and synthetic_adversarial.json
- [ ] HUMAN GATE: human_accepted field defaults to False

### 6.2 backend/evaluator.py
- [ ] load_ground_truth() → List[GroundTruthRecord]
- [ ] run_evaluation(ground_truth) → EvaluationReport
- [ ] confusion_matrix(predictions, labels) → dict
- [ ] precision_recall_per_category() → dict
- [ ] hallucination_rate(adversarial_set) → float
- [ ] save_results(report) → evaluation/results/run_{timestamp}.json

---

## Phase 7 — Deployment

### 7.1 Render (backend)
- [ ] Create render.yaml or use Render dashboard
- [ ] Set OPENAI_API_KEY in Render env vars
- [ ] Start command: uvicorn backend.main:app --host 0.0.0.0 --port $PORT
- [ ] Verify /health endpoint responds
- [ ] Verify /demo endpoint returns data
- [ ] Note the Render URL

### 7.2 Vercel (frontend)
- [ ] Set VITE_API_URL to Render URL in Vercel env vars
- [ ] Deploy from GitHub
- [ ] Verify Demo tab loads
- [ ] Verify Upload tab works on NEU PDF

### 7.3 Pre-demo checklist
- [ ] Hit /health 5 min before demo to wake Render
- [ ] Verify Demo tab loads in < 3 seconds
- [ ] Test Upload tab on NEU PDF end-to-end
- [ ] Have NEU PDF downloaded and ready to drag in

---

## Phase 8 — Documentation & Deliverables

- [ ] README.md (setup, run locally, architecture)
- [ ] Architecture diagram
- [ ] PDF documentation (arch, metrics, ethics, challenges, future work)
- [ ] Example outputs committed to repo
- [ ] Video demo script (10 min structure)
- [ ] Record video
- [ ] Web page (already covered by React app)

---

## Human Tasks (cannot be delegated to Claude Code)

- [ ] Manually annotate 20-35 NEU clauses for ground truth.json
- [ ] Review every synthetic clause — accept or reject each one
- [ ] Confirm adversarial cases are genuinely subtle (not obviously wrong)
- [ ] Run calibration sweep on faithfulness threshold
- [ ] Set threshold in alignment.py based on sweep results
- [ ] Interpret evaluation numbers — write the "what this means" paragraph
- [ ] Deploy to Render (requires Render account)
- [ ] Deploy to Vercel (requires Vercel account)
- [ ] Record the video
