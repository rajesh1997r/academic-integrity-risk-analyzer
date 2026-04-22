# AIRA — Project Status
**Last updated: April 2026 — Final sprint**

---

## Overall Progress

```
Phase 1 — Foundation          ████████████████████ 100%
Phase 2 — Embedding Pipeline  ████████████████████ 100%
Phase 3 — Core Intelligence   ████████████████████ 100%
Phase 4 — FastAPI Backend     ████████████████████ 100%
Phase 5 — React Frontend      ████████████████████ 100%
Phase 6 — Synthetic + Eval    ████████████████████ 100%
Phase 7 — Deployment          ████████████████████ 100%
Phase 8 — Documentation       ████████░░░░░░░░░░░░  40%
```

---

## Live URLs

| Service | URL | Status |
|---|---|---|
| Frontend (Vercel) | https://academic-integrity-risk-analyzer.vercel.app | ✅ Live |
| Backend (Render) | https://aira-api.onrender.com | ✅ Live (may cold-start) |

---

## Evaluation Results (actual numbers)

| Metric | Result | Notes |
|---|---|---|
| Classification accuracy | **90.2%** (46/51) | NEU ground truth, 51 clauses |
| Faithfulness score | **100%** | All citations exact verbatim substrings |
| Hallucination rate | **0.0%** | 21 adversarial synthetic clauses |
| AIUsageLoophole | **100% P / 100% R** | Best-performing category |
| EnforcementGap | **100% P / 87.5% R** | Strong |
| ScopeConflict | **0% P / 0% R** | Known blind spot — classifier cannot handle it |
| Ambiguity recall | **60%** | Misses 40% of true ambiguity cases |
| AuthorityConflict precision | **67%** | Some false positives |
| Fine-tuned gpt-4o-mini | **80.4%** vs 86.3% base | −5.9% accuracy, ~20x cost reduction |

---

## What Is Built

| Component | File | Status |
|---|---|---|
| PDF ingestion | backend/ingestion.py | ✅ |
| ChromaDB index | chroma_db/ | ✅ Pre-built, committed |
| Embeddings wrapper | backend/embeddings.py | ✅ |
| Risk classifier | backend/classifier.py | ✅ GPT-4o + fine-tuned fallback |
| Faithfulness scoring | backend/alignment.py | ✅ |
| Contradiction detection | backend/contradiction.py | ✅ |
| Pydantic schemas | backend/models.py | ✅ |
| FastAPI app | backend/main.py | ✅ All endpoints |
| Synthetic data generator | backend/synthetic.py | ✅ |
| Evaluation pipeline | backend/evaluator.py | ✅ |
| React frontend | frontend/src/ | ✅ 4 tabs, all components |
| Pre-computed NEU demo | demo_output.json | ✅ |
| Pre-computed Harvard demo | harvard_demo_output.json | ✅ |
| Ground truth annotations | data/ground_truth.json | ✅ 51 clauses |
| Evaluation results | evaluation/results/ | ✅ run_20260421_103952.json |
| Synthetic clauses | data/synthetic_*.json | ✅ 56 clauses |

---

## What Remains

| Deliverable | Owner | Status |
|---|---|---|
| System Design Document (SDD) | Gru tool | 🔲 Not started |
| Technical paper / report | CRITIQ tool | 🔲 Not started |
| Baseline comparison run | Python script | 🔲 Not done |
| Architecture diagram | Visual tool | 🔲 Not done |
| Video demo script | Human | 🔲 Not done |
| Video recording | Human | 🔲 Not done |

---

## Key Design Decisions (locked)

| Decision | Choice | Reason |
|---|---|---|
| LLM | GPT-4o (fine-tuned gpt-4o-mini as fallback) | Accuracy + cost tradeoff |
| Embeddings | text-embedding-3-small | Low cost, same API key |
| Vector store | ChromaDB pre-built index | Zero embedding cost at inference |
| Clause cap | 200 per upload | MIT has 454 clauses → uncapped = $4.54/upload at GPT-4o pricing |
| Demo strategy | Pre-computed JSON | Render sleeps; demo cannot depend on cold start |
| Taxonomy | 8 fixed categories, temperature 0 | Prevents hallucinated labels |
| Citation requirement | cited_text enforced in every prompt | No unsupported claims |
| Fine-tuning | gpt-4o-mini trained on 86 examples | 20x cheaper; acceptable for non-critical use |

---

## Known Weaknesses (must acknowledge in paper)

1. **ScopeConflict blind spot** — 0% precision and recall. Classifier cannot reason
   about contextual scope without cross-clause context. Single-clause classification
   is insufficient for this category.
2. **Ambiguity recall 60%** — Misses 4 of 10 true ambiguity cases. Likely conservative
   thresholding in system prompt.
3. **Narrow ground truth** — 51 clauses, single institution (NEU). Cannot generalize
   to other policy styles or institutions.
4. **No baseline comparison** — Vanilla GPT-4o accuracy on the same 51 clauses was
   not measured. Paper must acknowledge this as a limitation.
5. **Faithfulness condition is easy** — 100% because all cited texts are verbatim
   substrings. This metric does not test paraphrased or hallucinated citations.
6. **Synthetic data human review** — human_accepted field defaults to False.
   Verify that adversarial clauses were genuinely reviewed before citing the
   0.0% hallucination rate as meaningful.

---

## Deliverables Checklist

- [x] GitHub repo (public, complete source code)
- [x] Deployed URL (professor can access without setup)
- [x] Evaluation results with real numbers
- [x] README.md with setup + architecture
- [ ] PDF documentation / technical report
- [ ] System Design Document
- [ ] 10-minute video demo
- [ ] Architecture diagram

---

## Pre-Demo Checklist (run before showing professor)

- [ ] Hit https://aira-api.onrender.com/health at least 5 min before demo
- [ ] Verify Demo tab loads in < 3 seconds
- [ ] Test Upload tab on NEU PDF end-to-end
- [ ] Have NEU PDF downloaded and ready to drag in
- [ ] Check Evaluation tab shows real metrics
