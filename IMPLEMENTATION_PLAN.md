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

## Phase 2 — Embedding Pipeline ✅ COMPLETE

### 2.1 build_index.py ✅
- [x] Load all 3 PDFs through ingestion.py
- [x] Batch embed via OpenAI text-embedding-3-small (batch size 100)
- [x] Create ChromaDB PersistentClient at ./chroma_db
- [x] One collection per document (slug of filename)
- [x] Upsert: ids, embeddings, documents (text), metadatas (source_doc, page_num, position_index)
- [x] Verify: semantic query returns relevant clause
- [x] Commit chroma_db/ to repo

### 2.2 backend/embeddings.py ✅
- [x] load_index() → returns ChromaDB client
- [x] query_similar(text, collection_name, k=5) → List[Clause]
- [x] get_all_clauses(collection_name) → List[Clause]
- [x] get_all_embeddings() → List[Clause] + embeddings (used by contradiction.py)
- [x] index_loaded() → bool (used by /health endpoint)

---

## Phase 3 — Core Intelligence ✅ COMPLETE

### 3.1 backend/models.py ✅
- [x] Clause model
- [x] RiskAnnotation model
- [x] Contradiction model
- [x] AuditReport model (wraps everything)
- [x] SyntheticClause model
- [x] EvaluationResult model

### 3.2 backend/classifier.py ✅
- [x] System prompt: taxonomy definition + output schema
- [x] Chain-of-thought instruction (reasoning before label)
- [x] Citation enforcement (cited_text required)
- [x] classify_clause(clause_text) → RiskAnnotation
- [x] classify_batch(clauses) → List[RiskAnnotation]
- [x] Handle None path (no risk found)
- [x] Temperature: 0
- [x] response_format: json_object
- [x] Rate limit backoff (4-attempt retry)
- [x] Fine-tuned model fallback: ft:gpt-4o-mini-2024-07-18:personal:aira:DXBLUexI

### 3.3 backend/alignment.py ✅
- [x] embed_text(text) → List[float]
- [x] cosine_similarity(a, b) → float
- [x] score_annotation(annotation) → float (verbatim check + cosine fallback)
- [x] flag_low_confidence(annotation, threshold=0.65) → bool
- [x] compute_faithfulness(annotations) → float (supported/total)

### 3.4 backend/contradiction.py ✅
- [x] generate_candidate_pairs(clauses, embeddings) → top 30 pairs by cosine sim > 0.4
- [x] System prompt: contradiction detection with scope reasoning
- [x] check_contradiction(clause_a, clause_b) → Contradiction | None
- [x] Only flag if scope_explains_conflict = False
- [x] detect_all(clauses) → List[Contradiction]
- [x] Contradiction types: PermissionConflict, PunishmentConflict, ScopeOverlap, PolicyGap, None

---

## Phase 4 — FastAPI Backend ✅ COMPLETE

### 4.1 backend/main.py ✅
- [x] GET /health → {"status": "ok", "index_loaded": bool}
- [x] GET /demo → load and return demo_output.json (NEU)
- [x] GET /demo/harvard → load and return harvard demo output
- [x] POST /analyze — PDF upload → AuditReport JSON (200 clause cap enforced)
- [x] GET /evaluation → returns latest evaluation/results/*.json
- [x] GET /finetune/status → fine-tune job metadata
- [x] GET /finetune/compare → base vs. fine-tuned accuracy comparison
- [x] CORS configured for Vercel frontend URL
- [x] ChromaDB index loaded at startup via lifespan context

### 4.2 Pre-compute demo ✅
- [x] Run full pipeline on NEU PDF → demo_output.json (51 clauses, 21 flagged)
- [x] Run full pipeline on Harvard PDF → harvard_demo_output.json (26 clauses)
- [x] Both committed to repo root

---

## Phase 5 — React Frontend ✅ COMPLETE

### 5.1 Setup ✅
- [x] Vite + React
- [x] axios, recharts, tailwindcss installed
- [x] Tailwind configured with Inter font, custom animations (fadeInUp, float, widthGrow)
- [x] VITE_API_URL env var (points to Render in prod)

### 5.2 Components ✅
- [x] Scorecard.jsx — total clauses, flagged count, overall risk rating, faithfulness bar
- [x] ClauseTable.jsx — expandable rows, color stripe per category, confidence bar, cited text
- [x] ContradictionView.jsx — side-by-side clause A vs B, contradiction type badge
- [x] RiskHeatmap.jsx — recharts bar chart of category distribution
- [x] EvaluationDashboard.jsx — confusion matrix, precision/recall table, fine-tune comparison

### 5.3 Views ✅
- [x] DemoView.jsx — tabbed NEU / Harvard selector, pre-computed (zero API calls)
- [x] UploadView.jsx — drag-and-drop PDF, live pipeline, sample policy buttons
- [x] About page — hero, pipeline diagram, feature cards, CTA

### 5.4 App.jsx ✅
- [x] Tab navigation: About | Demo | Upload | Evaluation
- [x] About is default landing page
- [x] Hash-based routing (preserves active tab on reload)
- [x] Browser back/forward button support (popstate listener)
- [x] In-page back buttons on Demo, Upload, Evaluation views

---

## Phase 6 — Synthetic Data & Evaluation ✅ COMPLETE

### 6.1 backend/synthetic.py ✅
- [x] generate_clean_clauses(category, n=5) → List[SyntheticClause]
- [x] generate_adversarial_clauses(category, n=3) → List[SyntheticClause]
- [x] diversity_filter(new_clause, existing_clauses, threshold=0.85) → bool
- [x] run_generation() → data/synthetic_clean.json + data/synthetic_adversarial.json
- [x] 56 total synthetic clauses generated (35 clean + 21 adversarial)

### 6.2 backend/evaluator.py ✅
- [x] load_ground_truth() → reads data/ground_truth.json
- [x] run_evaluation() → classifies each, computes metrics
- [x] _build_confusion_matrix() → 8×8 matrix
- [x] _precision_recall() → per-category precision and recall
- [x] hallucination_rate() → adversarial false-positive rate
- [x] Saves results to evaluation/results/run_{timestamp}.json

### 6.3 Ground truth & results ✅
- [x] 51 NEU clauses manually annotated → data/ground_truth.json
- [x] Evaluation run completed → evaluation/results/run_20260421_103952.json
- [x] Accuracy: 90.2% (46/51) | Faithfulness: 100% | Hallucination rate: 0.0%

---

## Phase 7 — Deployment ✅ COMPLETE

### 7.1 Render (backend) ✅
- [x] OPENAI_API_KEY set in Render env vars
- [x] Start command: uvicorn backend.main:app --host 0.0.0.0 --port $PORT
- [x] /health endpoint verified
- [x] /demo endpoint returns NEU data
- [x] URL: https://aira-api.onrender.com

### 7.2 Vercel (frontend) ✅
- [x] VITE_API_URL set to Render URL in Vercel env vars
- [x] Deployed from GitHub (auto-deploy on push to main)
- [x] URL: https://academic-integrity-risk-analyzer.vercel.app
- [x] Demo tab verified loading
- [x] Upload tab verified end-to-end

### 7.3 Fine-tuning ✅
- [x] Training data generated from ground truth + synthetic set (69 train / 17 val)
- [x] Fine-tune job submitted: ftjob-WBr0yrqedovd1i4b90tsYcwo
- [x] Model: ft:gpt-4o-mini-2024-07-18:personal:aira:DXBLUexI
- [x] Results: 80.4% accuracy vs 86.3% GPT-4o base (−5.9% for ~20x cost reduction)

---

## Phase 8 — Documentation & Deliverables 🔲 IN PROGRESS

- [x] README.md — setup, architecture, live URLs, evaluation results
- [ ] System Design Document (SDD) — to be produced with Gru tool
- [ ] Technical paper / report — to be produced with CRITIQ tool
- [ ] Baseline comparison — vanilla GPT-4o on same 51 clauses (needed for paper)
- [ ] Architecture diagram (visual)
- [ ] Video demo script (10 min structure)
- [ ] Record video

---

## Human Tasks Status

| Task | Status |
|---|---|
| Manually annotate NEU clauses for ground truth | ✅ Done (51 clauses) |
| Deploy to Render | ✅ Done |
| Deploy to Vercel | ✅ Done |
| Review synthetic clauses (human_accepted flag) | ⚠️ human_accepted defaults False — verify before citing in paper |
| Run baseline (vanilla GPT-4o on same 51 clauses) | 🔲 Not done — needed for paper |
| Write SDD using Gru | 🔲 Next |
| Write technical paper using CRITIQ | 🔲 Next |
| Record video demo | 🔲 Last step |
