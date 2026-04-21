from __future__ import annotations

import json
import os
import time

from dotenv import load_dotenv
from openai import OpenAI, RateLimitError

load_dotenv()

from backend.models import Clause, RiskAnnotation

_client: OpenAI | None = None

VALID_CATEGORIES = {
    "Ambiguity",
    "UndefinedTerm",
    "EnforcementGap",
    "ScopeConflict",
    "AuthorityConflict",
    "AIUsageLoophole",
    "CircularDefinition",
    "None",
}

_SYSTEM_PROMPT = """You are a strict academic policy auditor. Your job is to identify GENUINE, CONSEQUENTIAL risks in university academic integrity policy clauses — not surface-level linguistic pedantry.

Classify the clause using EXACTLY ONE primary risk category:

- Ambiguity: The clause language is genuinely open to contradictory interpretations that would affect whether a student is found guilty. NOT mere vagueness — the ambiguity must create a real enforcement dilemma.

- UndefinedTerm: A SPECIFIC, TECHNICAL term central to the rule's application is used without definition, AND a reasonable student could not determine what it means in practice. DO NOT flag commonly understood academic terms (plagiarism, cheating, assignment, exam, citation, collaboration, coursework, academic integrity, student, faculty). Only flag terms like specific AI tool names, proprietary systems, or regulatory categories that genuinely need defining.

- EnforcementGap: There is NO plausible mechanism to detect, investigate, or act on the violation. The clause prohibits something with zero enforcement pathway.

- ScopeConflict: The clause explicitly applies to some students/contexts but not others in a way that creates an exploitable inconsistency.

- AuthorityConflict: Two or more offices/persons are given conflicting authority over the same decision, OR no authority is named at all for an enforcement action.

- AIUsageLoophole: The clause addresses AI use but leaves a clear, exploitable gap — e.g., prohibits "AI writing" but not AI-assisted outlining, or permits AI without defining what counts as AI.

- CircularDefinition: The clause defines a concept using the concept itself (e.g., "dishonest behavior means behavior that is dishonest").

- None: The clause is a standard, clear policy statement. When in doubt, use None. Most introductory and procedural clauses should be None.

IMPORTANT: Be conservative. A clause that is merely general or uses broad language is NOT automatically risky. Only flag when the risk would meaningfully affect enforcement or student fairness. Aim for roughly 40-60% of clauses flagged, not 90%.

cited_text must be an EXACT quote from the clause — the specific phrase that creates the risk.

Respond ONLY with valid JSON:
{
  "risk_category": "<category>",
  "secondary_category": "<category or null>",
  "reasoning": "<why this specific clause creates a real enforcement problem, 1-3 sentences>",
  "cited_text": "<exact quote from clause>",
  "confidence": <float 0.0–1.0>
}"""


def _get_client() -> OpenAI:
    global _client
    if _client is None:
        _client = OpenAI(api_key=os.environ["OPENAI_API_KEY"])
    return _client


def classify_clause(clause: Clause, model: str = "gpt-4o") -> RiskAnnotation:
    client = _get_client()
    for attempt in range(4):
        try:
            response = client.chat.completions.create(
                model=model,
                temperature=0,
                response_format={"type": "json_object"},
                messages=[
                    {"role": "system", "content": _SYSTEM_PROMPT},
                    {"role": "user", "content": f"Policy clause:\n\n{clause.text}"},
                ],
            )
            break
        except RateLimitError:
            if attempt == 3:
                raise
            time.sleep(2 ** attempt)  # 1s, 2s, 4s backoff
    raw = json.loads(response.choices[0].message.content)

    risk_cat = raw.get("risk_category", "None")
    if risk_cat not in VALID_CATEGORIES:
        risk_cat = "None"

    secondary = raw.get("secondary_category")
    if secondary and secondary not in VALID_CATEGORIES:
        secondary = None

    confidence = float(raw.get("confidence", 0.5))
    confidence = max(0.0, min(1.0, confidence))

    return RiskAnnotation(
        clause_id=clause.id,
        clause_text=clause.text,
        risk_category=risk_cat,
        secondary_category=secondary,
        reasoning=raw.get("reasoning", ""),
        cited_text=raw.get("cited_text", clause.text[:100]),
        confidence=confidence,
        low_confidence_flag=confidence < 0.65,
    )


def classify_batch(clauses: list[Clause], model: str = "gpt-4o") -> list[RiskAnnotation]:
    annotations = []
    for clause in clauses:
        annotation = classify_clause(clause, model=model)
        annotations.append(annotation)
    return annotations
