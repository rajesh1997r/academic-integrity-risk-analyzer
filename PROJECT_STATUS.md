# AIRA — Project Status
**Last updated: Session 1**

---

## Overall Progress

```
Phase 1 — Foundation          ████████████████████ 100%
Phase 2 — Embedding Pipeline  ░░░░░░░░░░░░░░░░░░░░   0%
Phase 3 — Core Intelligence   ░░░░░░░░░░░░░░░░░░░░   0%
Phase 4 — FastAPI Backend     ░░░░░░░░░░░░░░░░░░░░   0%
Phase 5 — React Frontend      ░░░░░░░░░░░░░░░░░░░░   0%
Phase 6 — Synthetic + Eval    ░░░░░░░░░░░░░░░░░░░░   0%
Phase 7 — Deployment          ░░░░░░░░░░░░░░░░░░░░   0%
Phase 8 — Documentation       ░░░░░░░░░░░░░░░░░░░░   0%
```

---

## What Is Built

### ingestion.py ✅
- Location: backend/ingestion.py
- Tested on: MIT (454 clauses), Harvard (29), NEU (66)
- Status: Working, human spot-checked

### Source Documents ✅
| Document | Location | Clauses | AI Language |
|---|---|---|---|
| MIT Handbook | data/policies/mitt.pdf | 454 | None |
| Harvard HUIT Guidelines | data/policies/harvard_ai.pdf | 29 | Strong |
| NEU Academic Integrity | data/policies/neu_integrity.pdf | 66 | Present ← DEMO DOC |

---

## What Is Next

**Immediate next task:** `build_index.py`

Run locally with your OpenAI API key.
This builds the ChromaDB vector index from all 3 PDFs.
Output goes to chroma_db/ directory.
Commit chroma_db/ to repo after successful build.

---

## Blockers

| Blocker | Type | Resolution |
|---|---|---|
| build_index.py not run yet | Human task | Need local Python + OpenAI key |
| ground_truth.json empty | Human task | Manually annotate 20-35 NEU clauses |
| Faithfulness threshold TBD | Human decision | Run calibration sweep after eval run |
| Render account needed | Human task | Sign up at render.com |
| Vercel account needed | Human task | Sign up at vercel.com |

---

## Key Decisions Made (do not revisit)

| Decision | Choice | Reason |
|---|---|---|
| LLM | GPT-4o | Existing API key |
| Embeddings | text-embedding-3-small | Same key, low cost |
| Vector store | ChromaDB pre-built | No external service |
| Backend | FastAPI on Render | Python-native |
| Frontend | React on Vercel | Professional, portfolio-ready |
| Demo document | NEU policy | Best AI language coverage |
| UI pattern | Demo tab + Upload tab | Professor lands on finished output |

---

## Risk Watch

| Risk | Status |
|---|---|
| Render cold start (30s) | Mitigated — hit /health before demo |
| ChromaDB load on Render | Unverified — test after deployment |
| Faithfulness threshold arbitrary | Open — needs calibration sweep |
| Synthetic data quality | Open — human review required |

---

## Metrics Targets (course evaluation)

| Metric | Target | Status |
|---|---|---|
| Risk classification accuracy | >70% on annotated set | Not run |
| Faithfulness score | >0.65 on NEU | Not run |
| Hallucination rate | Measurable + reported | Not run |
| Contradiction precision | >60% | Not run |

Note: honest reporting of results matters more than hitting targets.
A well-documented 60% is better than a fabricated 90%.

---

## Deliverables Checklist

- [ ] GitHub repo (public, complete source code)
- [ ] Deployed URL (professor can access without setup)
- [ ] PDF documentation
- [ ] 10-minute video demo
- [ ] Web page (covered by React app)
- [ ] Example outputs committed to repo
- [ ] Evaluation results with real numbers
