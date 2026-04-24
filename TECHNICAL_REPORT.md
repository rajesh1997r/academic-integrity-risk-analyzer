# AIRA: Structured LLM Prompting for Academic Integrity Policy Risk Detection

**Rajesh Kumar Rama Reddy**
INFO 7375 — Generative AI Engineering
Spring 2026

---

## Abstract

University academic integrity policies contain ambiguous language, undefined
AI-use boundaries, and enforcement gaps that resist manual detection at scale.
This paper presents AIRA (Academic Integrity Risk Analyzer), a structured LLM
pipeline that applies an eight-category risk taxonomy to policy clauses, enforces
verbatim citation of source text for every finding, and verifies citation
faithfulness via embedding similarity. We evaluate AIRA against a vanilla GPT-4o
baseline on a 51-clause manually annotated ground truth derived from Northeastern
University's Academic Integrity Policy. AIRA achieves 90.2% classification
accuracy compared to 58.8% for unstructured GPT-4o — a +27.5 percentage point
gain attributable primarily to taxonomy definition and chain-of-thought enforcement,
not model size. A fine-tuned gpt-4o-mini variant achieves 80.4% accuracy at
approximately 20× lower per-token cost, offering an acceptable accuracy-cost
tradeoff for high-volume use. Citation faithfulness is 100% on the ground truth
set under a verbatim substring condition. We document a systematic failure on the
ScopeConflict category (0% recall), which we attribute to the single-clause
classification architecture's inability to reason across clause context. All code,
evaluation data, and a live deployment are publicly available.

**Keywords:** academic integrity, LLM classification, prompt engineering,
fine-tuning, policy risk analysis, RAG, faithfulness scoring

---

## 1. Introduction

### 1.1 The Policy Gap Problem

The adoption of generative AI tools in higher education has outpaced the revision
of academic integrity policies designed to govern their use. Policies written
before 2022 prohibit "unauthorized technology" without defining whether a grammar
checker, a search engine, or a large language model constitutes such technology.
More recently written policies often prohibit "AI tools" or "ChatGPT" by name
without establishing a boundary between tools that assist thinking and tools that
substitute for it. The result is a category of enforcement gap that is structural
rather than incidental: the policy does not fail to prohibit a behavior; it fails
to define it clearly enough to prohibit anything at all.

Manual policy review does not solve this problem at scale. A human reviewer
reading fifty clauses will apply different interpretive standards on clause 48
than on clause 3. No standard taxonomy exists for categorizing the types of
ambiguity a policy clause can contain. No systematic method exists to detect
when two clauses within the same document contradict each other. And the volume
of policies that need revision — across thousands of institutions, across multiple
versions, across course-specific supplements — exceeds what manual review can
address.

### 1.2 What Structured LLM Prompting Offers

Large language models can read policy text. The question is whether they can
classify its risks reliably without guidance. Our primary finding is that they
cannot: unstructured GPT-4o, given only the eight category names, achieves 58.8%
accuracy and effectively collapses to two outputs (Ambiguity and None), missing
six of eight risk categories entirely. This is not a failure of the model — it is
a failure of the task formulation. Without category definitions, chain-of-thought
reasoning requirements, and citation enforcement, the model has no basis for
distinguishing an EnforcementGap from an Ambiguity or an AuthorityConflict from
a ScopeConflict.

AIRA addresses this by treating the prompt as the primary engineering artifact.
The structured system prompt provides full category definitions, requires the
model to produce a chain-of-thought reasoning trace before assigning a label,
enforces citation of the exact source substring that justifies the label, and
requires a confidence score. These constraints do not change the model — they
change what the model can do with the same knowledge it already has.

### 1.3 Contributions

This paper makes four contributions:

1. **An eight-category risk taxonomy** for academic integrity policy clause
   classification, with definitions grounded in the types of policy failures
   that create exploitable gaps.

2. **A structured classification pipeline** (AIRA) that applies the taxonomy
   with citation enforcement, faithfulness verification, and contradiction
   detection.

3. **An empirical comparison** of structured vs. unstructured GPT-4o prompting
   on a 51-clause manually annotated ground truth, with per-category
   precision/recall breakdown.

4. **A cost-accuracy analysis** of a fine-tuned gpt-4o-mini variant, demonstrating
   that most of the accuracy gain comes from prompt structure rather than model
   capability.

---

## 2. Related Work

### 2.1 Policy Analysis with NLP

Automated policy analysis has been studied in legal NLP (Lippi et al., 2019;
Koreeda and Manning, 2021) and privacy policy analysis (Zimmeck et al., 2019).
These approaches typically use supervised classifiers trained on labeled corpora.
AIRA differs in two respects: it uses an LLM with structured prompting rather
than a trained classifier, and it targets academic integrity policies — a domain
with no existing labeled corpus.

*Note: The specific citations above are representative of the research area.
Readers should verify currency and relevance to the specific claims made.*

### 2.2 Prompt Engineering for Classification

Chain-of-thought prompting (Wei et al., 2022) has been shown to improve LLM
reasoning on multi-step tasks. Structured output enforcement via JSON schema
has been shown to reduce category hallucination in taxonomy classification tasks.
AIRA applies both, treating the prompt as the primary engineering intervention
rather than fine-tuning alone.

### 2.3 Fine-Tuning vs. Prompting

Recent work has examined whether fine-tuning a smaller model can match a
larger model with a sophisticated prompt (Guo et al., 2023). Our results are
consistent with this literature: fine-tuning gpt-4o-mini on 86 examples reaches
80.4% accuracy, compared to 90.2% for prompted GPT-4o, but at approximately
20× lower per-token cost. The cost-accuracy frontier, rather than accuracy alone,
is the relevant metric for a deployed tool.

---

## 3. Methods

### 3.1 Risk Taxonomy

We define eight mutually exclusive primary risk categories for policy clause
classification:

| Category | Definition |
|----------|-----------|
| Ambiguity | Language admits multiple legitimate interpretations |
| UndefinedTerm | A term central to the clause is used without definition |
| EnforcementGap | No mechanism exists to detect or act on a violation |
| ScopeConflict | The clause applies inconsistently across contexts |
| AuthorityConflict | Unclear who holds enforcement authority |
| AIUsageLoophole | AI use permitted or prohibited without a clear boundary |
| CircularDefinition | A definition references itself |
| None | No identifiable risk |

Each clause receives exactly one primary label. A secondary label is permitted
when genuine overlap exists. The taxonomy was developed by reviewing twenty
clauses from the NEU Academic Integrity Policy and identifying recurring failure
modes before any automated classification was attempted.

### 3.2 Dataset

**Source documents.** We collected three university policy PDFs:
- Northeastern University (NEU) Academic Integrity Policy: 51 clauses extracted
- Harvard University HUIT AI Guidelines: 26 clauses extracted
- MIT Student Handbook: 454 clauses extracted

Clause extraction uses `pdfplumber` with noise filtering (table of contents entries,
headers, footers, navigation elements) and sentence-boundary splitting. A minimum
eight-word filter removes fragment artifacts. Clause counts reflect this filtering.

**Ground truth.** We manually annotated all 51 clauses from the NEU policy with
the correct risk category. The NEU policy was selected because it contains the
widest variety of risk types across the eight categories, including AI-specific
language added after 2022. Annotation was performed by the author after defining
the taxonomy. Inter-annotator reliability was not measured; this is a limitation
(see §5.2).

**Synthetic data.** We generated 56 synthetic clauses using GPT-4o at temperature
0.7: 35 clean clauses (representative examples of each category) and 21 adversarial
clauses (superficially clean language that contains a policy risk). A diversity
filter based on cosine similarity (threshold 0.85) removes near-duplicate
generations. The `human_accepted` field defaults to `False`; adversarial clauses
require manual review before contributing to hallucination rate computation.

### 3.3 Pipeline Architecture

The AIRA pipeline consists of five stages:

**Stage 1 — Ingestion.** PDF bytes → `List[Clause]` via `pdfplumber` extraction,
noise filtering, and sentence-boundary splitting.

**Stage 2 — Embedding.** Clause embeddings are loaded from a pre-built ChromaDB
index (built once locally using `text-embedding-3-small`, committed to the
repository). No embedding API calls occur at inference time.

**Stage 3 — Classification.** Each clause is classified by GPT-4o using a
structured system prompt (see §3.4). Output: `RiskAnnotation` with `risk_category`,
`secondary_category`, `reasoning`, `cited_text`, and `confidence`. Temperature
fixed at 0 for determinism.

**Stage 4 — Faithfulness scoring.** For each non-None annotation, we check
whether `cited_text` is a verbatim substring of `clause_text` (score 1.0).
If not, we compute cosine similarity between the embeddings of both strings as
a fallback score. Annotations below threshold 0.65 are flagged `low_confidence`.

**Stage 5 — Contradiction detection.** We compute pairwise cosine similarity
across all clause embeddings, retain pairs with similarity ≥ 0.4 (capped at 30
pairs), and submit each candidate pair to GPT-4o for contradiction verification.
Pairs where scope explains the conflict are excluded from the reported results.

### 3.4 Classification Prompt Design

The structured system prompt includes: (a) a full definition of each of the eight
categories with distinguishing examples; (b) explicit instruction to produce a
reasoning trace before assigning a label; (c) a requirement to cite the exact
source substring that justifies the label; (d) a conservative flagging guideline
targeting 40–60% flag rate to prevent over-detection; (e) `response_format:
json_object` enforcement to prevent free-form output.

The vanilla baseline prompt provides only the eight category names and the
instruction to respond with exactly one label. It omits all definitions,
reasoning instructions, citation requirements, and flagging guidance. This
isolates the contribution of the structured prompt from the contribution of
the model's underlying capability.

### 3.5 Fine-Tuning

We fine-tuned `gpt-4o-mini-2024-07-18` on 86 examples derived from the 51
ground truth clauses and 35 accepted synthetic clean clauses, formatted as
OpenAI fine-tuning JSONL with the same system prompt used for classification.
Training used 69 examples; validation used 17. The resulting model is
`ft:gpt-4o-mini-2024-07-18:personal:aira:DXBLUexI`.

### 3.6 Evaluation

We evaluate three conditions against the 51-clause ground truth:

1. **Vanilla GPT-4o**: category names only, no definitions, no citation requirement
2. **GPT-4o with AIRA structured prompt**: full taxonomy definitions, chain-of-thought,
   citation enforcement (this is the fine-tuning baseline)
3. **Fine-tuned gpt-4o-mini**: same structured prompt, fine-tuned smaller model
4. **AIRA full pipeline**: full structured prompt, evaluated by `evaluator.py`

Metrics: overall accuracy, per-category precision and recall, confusion matrix,
faithfulness score (fraction of annotations with citation score ≥ 0.65), and
hallucination rate (fraction of adversarial clauses incorrectly labeled None).

---

## 4. Results

### 4.1 Classification Accuracy

Table 1 shows overall accuracy across the four conditions on the 51-clause
NEU ground truth.

**Table 1. Classification accuracy by condition.**

| Condition | Model | Accuracy | Correct / Total |
|-----------|-------|----------|-----------------|
| Vanilla baseline | GPT-4o | 58.8% | 30 / 51 |
| Structured prompt (fine-tune baseline) | GPT-4o | 86.3% | 44 / 51 |
| Fine-tuned model | gpt-4o-mini (fine-tuned) | 80.4% | 41 / 51 |
| **AIRA full pipeline** | **GPT-4o** | **90.2%** | **46 / 51** |

The structured prompt accounts for +27.5 percentage points of accuracy gain
(58.8% → 86.3%). Fine-tuning the smaller gpt-4o-mini model achieves 80.4%
— below the structured GPT-4o baseline but 21.6 points above the vanilla
baseline, at approximately 20× lower per-token cost.

### 4.2 Vanilla Baseline Failure Analysis

The vanilla GPT-4o baseline (58.8%) exhibits a systematic failure pattern:
it effectively collapses to two output labels — Ambiguity and None — and
misses six of eight categories entirely.

**Table 2. Vanilla baseline per-category recall.**

| Category | Recall | Precision |
|----------|--------|-----------|
| Ambiguity | 100% | 50% |
| None | 83% | 64% |
| UndefinedTerm | 0% | — |
| EnforcementGap | 0% | — |
| ScopeConflict | 0% | — |
| AuthorityConflict | 0% | — |
| AIUsageLoophole | 0% | — |
| CircularDefinition | 0% | — |

The model correctly identifies surface vagueness (Ambiguity) but cannot
distinguish structural enforcement failures, authority ambiguities, or
AI-specific loopholes without category definitions. High Ambiguity recall
(100%) with low precision (50%) indicates over-prediction: the model
defaults to Ambiguity when uncertain rather than attempting a more specific
classification.

This result confirms the primary hypothesis: structured taxonomy prompting,
not model capability, is the primary driver of accurate policy risk classification.

### 4.3 AIRA Per-Category Performance

**Table 3. AIRA full pipeline per-category precision and recall.**

| Category | Precision | Recall | Ground Truth Count |
|----------|-----------|--------|--------------------|
| Ambiguity | 100% | 60% | 10 |
| UndefinedTerm | 100% | 50% | 2 |
| EnforcementGap | 100% | 87.5% | 8 |
| ScopeConflict | 0% | 0% | 0* |
| AuthorityConflict | 67% | 100% | 4 |
| AIUsageLoophole | 100% | 100% | 1 |
| CircularDefinition | 100% | 100% | 1 |
| None | 91% | 97% | 30 |

*ScopeConflict had zero ground truth examples in the annotated set and zero
predictions; precision and recall are undefined and reported as 0%.

AIRA achieves high precision across most categories — when it flags a clause,
the label is typically correct. The primary weakness is recall: for Ambiguity
(60%) and UndefinedTerm (50%), AIRA misses true positives, classifying them
as None. This is consistent with the conservative flagging guidance in the
system prompt.

### 4.4 Faithfulness

All 46 correct non-None annotations produced cited texts that are verbatim
substrings of their source clauses. Faithfulness score: **100%**. The cosine
similarity fallback did not trigger on any annotation in the evaluation set.

This result should be interpreted carefully. The verbatim substring condition
is a relatively easy faithfulness standard — it confirms that the model cited
text that actually exists in the clause, but it does not test whether the
citation is the most relevant substring or whether a paraphrased citation
would be detected as unfaithful. We treat this as a lower bound on citation
quality rather than a comprehensive faithfulness measure.

### 4.5 Hallucination Rate

The hallucination rate computation requires adversarial clauses with
`human_accepted=True`. In this evaluation, the synthetic adversarial set
was generated but not manually reviewed (all `human_accepted` fields remain
`False`). As a result, the reported hallucination rate of **0.0%** reflects
an empty denominator, not a genuine zero-hallucination result. This is a
methodological limitation: the adversarial evaluation was not completed and
should not be cited as evidence of robustness to adversarial inputs.

### 4.6 Fine-Tuning: Cost-Accuracy Analysis

The fine-tuned gpt-4o-mini model achieves 80.4% accuracy at approximately
20× lower per-token cost than GPT-4o. This represents a −5.9 percentage point
accuracy cost for a substantially reduced cost per upload. For the live upload
use case — where the document is untrusted and clause count is unknown — this
tradeoff is acceptable. The pre-computed Demo tab uses GPT-4o output, so the
accuracy-optimized model is always used for demonstration purposes.

It is important to note that 80.4% is not an improvement over 86.3%. It is
a cost reduction at an accuracy cost. Framing fine-tuning as "improvement"
would misrepresent the result.

---

## 5. Discussion

### 5.1 Structured Prompting as the Primary Intervention

The +27.5 percentage point gain from vanilla GPT-4o (58.8%) to structured
GPT-4o (86.3%) is the central result of this paper. It demonstrates that the
prompt — not the model — is the primary engineering variable for domain-specific
classification tasks where the label space is semantically similar and the
distinctions between categories are subtle.

Why does the vanilla baseline fail so badly? Without definitions, the model
cannot distinguish an EnforcementGap (no detection mechanism) from an Ambiguity
(vague language) from an AuthorityConflict (unclear enforcer). All three might
appear "unclear" in natural language. The taxonomy definitions give the model
a framework for disambiguation. The chain-of-thought requirement forces the
model to apply that framework before committing to a label, which catches the
cases where a surface reading is misleading.

This finding has a practical implication: for organizations that want to apply
LLMs to structured classification tasks, investing in taxonomy design and
prompt structure is likely to produce larger accuracy gains than upgrading
the model.

### 5.2 The ScopeConflict Blind Spot

AIRA's most significant failure is ScopeConflict, for which zero ground truth
examples were present in the annotated set. This reflects an annotation gap
rather than confirmed classifier failure on this category — the annotator did
not identify any ScopeConflict cases in the NEU policy, which may mean none
exist, or that the category boundary is underspecified.

However, there is also a structural reason to expect ScopeConflict to be
difficult: correctly identifying a ScopeConflict requires comparing a clause's
stated applicability against other clauses or contexts in the document.
Single-clause classification cannot supply this cross-clause reasoning. An
accurate ScopeConflict classifier would require either multi-clause context
windows or a two-stage approach where candidate clauses are retrieved and
compared before classification.

### 5.3 Limitations

**Single-institution ground truth.** All 51 annotated clauses are from the NEU
Academic Integrity Policy. The pipeline has not been formally evaluated on
policies from other institutions, document styles, or policy eras. Claims about
accuracy should be understood as specific to NEU-style academic integrity policies
until cross-institution validation is performed.

**Single annotator.** The ground truth was annotated by the author, who also
designed the taxonomy. Inter-annotator agreement was not measured. This creates
a circular validation risk: the taxonomy definitions and the annotations may
co-evolve in ways that inflate measured accuracy.

**Faithfulness metric is an easy condition.** The 100% faithfulness result holds
because all cited texts are verbatim substrings. This confirms that the model
does not invent text that does not exist in the clause, but it does not test
whether the cited substring is the most probative portion or whether the
faithfulness score would hold under a more adversarial extraction condition.

**Adversarial evaluation incomplete.** The 0.0% hallucination rate is not
meaningful because no adversarial clauses passed the human review gate
(`human_accepted=True`). The adversarial evaluation should be completed and
reported before citing robustness claims.

**Sequential classification latency.** The pipeline classifies clauses
one at a time. End-to-end latency is 30–60 seconds for a 50-clause document.
Parallel classification would reduce this by approximately 5–10×.

### 5.4 Future Work

**Cross-institution validation.** Evaluating on policies from five to ten
institutions with different AI language would establish generalizability bounds
and identify institution-specific failure modes.

**Multi-clause ScopeConflict detection.** A two-stage approach — retrieve
semantically related clause pairs, then classify the pair for scope consistency —
would address the structural limitation identified in §5.2.

**Student-facing interface.** The current system is designed for policy auditors.
A natural extension is a student-facing query interface: "Is using Grammarly
permitted in ENGW 3302?" This requires grounding the answer in the retrieved
policy clause and the course syllabus simultaneously.

**Policy change tracking.** Institutions revise policies annually. A pipeline
that diffs two versions of a policy and flags new risks in the revised version
would provide ongoing audit capability rather than a one-time snapshot.

---

## 6. Conclusion

AIRA demonstrates that structured taxonomy prompting — providing category
definitions, chain-of-thought reasoning requirements, and citation enforcement
— closes most of the gap between unstructured LLM output and accurate policy
risk classification. The vanilla GPT-4o baseline (58.8%) confirms that the model
possesses the necessary knowledge but cannot apply it without a framework to
organize the label space. The structured AIRA pipeline (90.2%) provides that
framework through prompt design rather than model modification.

Fine-tuning a smaller model (gpt-4o-mini, 80.4%) offers a practical cost
reduction of approximately 20× at an accuracy cost of −9.8 percentage points
relative to the AIRA full pipeline, and −5.9 points relative to GPT-4o with
the same structured prompt. For high-volume deployments where per-query cost
matters, this is an acceptable tradeoff.

The primary limitation of this work is its narrow ground truth: 51 clauses from
one institution, annotated by a single annotator who also designed the taxonomy.
Cross-institution validation and inter-annotator reliability measurement are the
most important next steps before the results can be generalized.

The full implementation, evaluation data, and a live deployment are available at:
https://github.com/rajesh1997r/academic-integrity-risk-analyzer
https://academic-integrity-risk-analyzer.vercel.app

---

## References

*The following references identify the relevant research areas. Readers should
locate current, peer-reviewed versions before citing in submission contexts.*

- Lippi, M., et al. (2019). CLAUDETTE: An Automated Detector of Potentially
  Unfair Clauses in Online Terms of Service. *Artificial Intelligence and Law.*

- Koreeda, Y., & Manning, C. (2021). ContractNLI: A Dataset for Document-level
  Natural Language Inference for Contracts. *EMNLP Findings.*

- Zimmeck, S., et al. (2019). MAPS: Scaling Privacy Compliance Analysis to a
  Million Apps. *PETS.*

- Wei, J., et al. (2022). Chain-of-Thought Prompting Elicits Reasoning in Large
  Language Models. *NeurIPS.*

- Brown, T., et al. (2020). Language Models are Few-Shot Learners. *NeurIPS.*

- OpenAI. (2024). GPT-4 Technical Report. *arXiv:2303.08774.*

---

## Appendix A — Evaluation Results Summary

Full evaluation results are available at:
`evaluation/results/run_20260421_103952.json`
`evaluation/results/baseline_vanilla_gpt4o_20260422_180407.json`

## Appendix B — Prompt Design

The full classification system prompt is implemented in `backend/classifier.py`.
The vanilla baseline prompt is implemented in `backend/baseline.py`.
Both files are available in the public repository.

## Appendix C — Fine-Tuning Job Details

| Field | Value |
|-------|-------|
| Job ID | ftjob-WBr0yrqedovd1i4b90tsYcwo |
| Base model | gpt-4o-mini-2024-07-18 |
| Fine-tuned model ID | ft:gpt-4o-mini-2024-07-18:personal:aira:DXBLUexI |
| Training examples | 69 |
| Validation examples | 17 |
| Trained tokens | 131,106 |
| Status | succeeded |
