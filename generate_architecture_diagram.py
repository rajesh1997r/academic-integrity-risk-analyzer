"""Generate AIRA architecture diagram — clean, readable version.
Output: docs/architecture.png
"""
from __future__ import annotations
from pathlib import Path
import matplotlib.pyplot as plt
import matplotlib.patches as mpatches
from matplotlib.patches import FancyBboxPatch

Path("docs").mkdir(exist_ok=True)

# ── Colours ───────────────────────────────────────────────────────────────────
BG      = "#0f172a"
PANEL   = "#1e293b"
BORDER  = "#334155"
WHITE   = "#f1f5f9"
MUTED   = "#94a3b8"
INDIGO  = "#818cf8"
VIOLET  = "#a78bfa"
TEAL    = "#2dd4bf"
EMERALD = "#34d399"
AMBER   = "#fbbf24"
RED     = "#f87171"
PINK    = "#f472b6"

fig = plt.figure(figsize=(22, 17), facecolor=BG)
ax  = fig.add_axes([0.03, 0.02, 0.94, 0.94])
ax.set_xlim(0, 22)
ax.set_ylim(0, 17)
ax.axis("off")
ax.set_facecolor(BG)


# ── Primitives ────────────────────────────────────────────────────────────────
def rect(x, y, w, h, fc, ec, lw=1.8, r=0.25, alpha=1.0):
    p = FancyBboxPatch((x, y), w, h,
                       boxstyle=f"round,pad=0,rounding_size={r}",
                       facecolor=fc, edgecolor=ec, linewidth=lw,
                       alpha=alpha, zorder=3)
    ax.add_patch(p)

def txt(x, y, s, size=10, color=WHITE, bold=False, ha="center", va="center"):
    ax.text(x, y, s, fontsize=size, color=color,
            fontweight="bold" if bold else "normal",
            ha=ha, va=va, zorder=5, fontfamily="DejaVu Sans")

def arrow_h(x1, x2, y, color=MUTED, lw=2):
    ax.annotate("", xy=(x2, y), xytext=(x1, y),
                arrowprops=dict(arrowstyle="-|>", color=color,
                                lw=lw, mutation_scale=16), zorder=4)

def arrow_v(x, y1, y2, color=MUTED, lw=2):
    ax.annotate("", xy=(x, y2), xytext=(x, y1),
                arrowprops=dict(arrowstyle="-|>", color=color,
                                lw=lw, mutation_scale=16), zorder=4)

def section_bar(x, y, w, label, color):
    rect(x, y, w, 0.52, fc=color + "44", ec=color, lw=1.5, r=0.15)
    txt(x + w/2, y + 0.26, label, size=10, color=color, bold=True)

def divider(y):
    ax.plot([0, 22], [y, y], color=BORDER, lw=0.8, zorder=2)


# ═════════════════════════════════════════════════════════════════════════════
# TITLE
# ═════════════════════════════════════════════════════════════════════════════
txt(11, 16.55, "AIRA  —  Academic Integrity Risk Analyzer", size=17, bold=True)
txt(11, 16.1, "System Architecture   |   INFO 7375 Generative AI Engineering   |   Northeastern University",
    size=10, color=MUTED)
divider(15.78)


# ═════════════════════════════════════════════════════════════════════════════
# SECTION 1 — Deployment  (y 13.5 – 15.6)
# ═════════════════════════════════════════════════════════════════════════════
section_bar(0, 15.25, 22, "SECTION 1  —  DEPLOYMENT TOPOLOGY", INDIGO)

BOX_Y, BOX_H = 13.4, 1.6
BOXES_DEPLOY = [
    (0.4,  4.0, "User Browser",        "academic-integrity-risk-\nanalyzer.vercel.app", "#1e293b", INDIGO),
    (5.4,  4.0, "Vercel  (Frontend)",  "React SPA  |  Vite + Tailwind\nAbout  Demo  Upload  Eval", "#1a1f3a", "#818cf8"),
    (10.4, 4.0, "Render  (Backend)",   "FastAPI  |  Python 3.11\naira-api.onrender.com", "#0f2218", EMERALD),
    (15.4, 6.0, "OpenAI  API",         "GPT-4o  |  gpt-4o-mini (fine-tuned)\ntext-embedding-3-small", "#1c1030", VIOLET),
]

for (bx, bw, title, sub, fc, ec) in BOXES_DEPLOY:
    rect(bx, BOX_Y, bw, BOX_H, fc=fc, ec=ec, lw=2)
    txt(bx + bw/2, BOX_Y + BOX_H - 0.42, title, size=11, bold=True, color=ec)
    # horizontal divider inside box
    ax.plot([bx + 0.2, bx + bw - 0.2], [BOX_Y + 0.9, BOX_Y + 0.9],
            color=BORDER, lw=0.8, zorder=4)
    txt(bx + bw/2, BOX_Y + 0.44, sub, size=8.5, color=MUTED)

# arrows between deploy boxes
MIDPOINTS = [(4.4, 5.4), (9.4, 10.4), (14.4, 15.4)]
LABELS    = ["HTTPS", "REST", "API calls"]
for (x1, x2), lbl in zip(MIDPOINTS, LABELS):
    arrow_h(x1, x2, BOX_Y + BOX_H/2, color=INDIGO, lw=2)
    txt((x1+x2)/2, BOX_Y + BOX_H/2 + 0.25, lbl, size=8.5, color=INDIGO)

# cold-start note
txt(11, BOX_Y - 0.28,
    "Note: Render free tier sleeps after 15 min inactivity  —  hit  /health  before demo",
    size=8.5, color=AMBER)

divider(13.0)


# ═════════════════════════════════════════════════════════════════════════════
# SECTION 2 — Pipeline  (y 7.8 – 12.8)
# ═════════════════════════════════════════════════════════════════════════════
section_bar(0, 12.55, 22, "SECTION 2  —  PIPELINE DATA FLOW  (POST /analyze)", TEAL)

# ── Layout constants ──────────────────────────────────────────────────────────
PY   = 10.6    # box bottom-left y
PH   = 1.6     # box height
CY   = PY + PH / 2  # center y for arrows

# ── PDF input ────────────────────────────────────────────────────────────────
rect(0.3, PY + 0.35, 1.3, 0.9, fc=PANEL, ec=BORDER, lw=1.2, r=0.15)
txt(0.95, CY, "PDF\nUpload", size=9, color=MUTED)
arrow_h(1.6, 2.2, CY, color=TEAL, lw=2)

# ── Stage boxes ───────────────────────────────────────────────────────────────
# (x,   w,    title,                 subtitle,                     badge_txt,              badge_c,  ec,     fc)
STAGES = [
    (2.2,  3.8, "ingestion.py",       "PDF  ->  List[Clause]",      "No API calls",         EMERALD,  INDIGO, "#141e35"),
    (6.5,  3.8, "classifier.py",      "Clause  ->  RiskAnnotation", "1 GPT-4o call/clause", PINK,     PINK,   "#2a0e28"),
    (10.8, 3.8, "alignment  +  contradiction",
                                       "Faithfulness  &  Contradiction detection",
                                                                     "Up to 30 GPT-4o calls",AMBER,    TEAL,   "#082020"),
    (15.1, 6.5, "AuditReport",        "Final JSON response to frontend",
                                                                     "",                     None,     EMERALD,"#082418"),
]

for (sx, sw, stitle, ssub, sbadge, sbc, sec, sfc) in STAGES:
    rect(sx, PY, sw, PH, fc=sfc, ec=sec, lw=2)
    # coloured title strip at top — white text on solid colour
    rect(sx, PY + PH - 0.52, sw, 0.52, fc=sec + "cc", ec=sec, lw=0, r=0.18)
    txt(sx + sw/2, PY + PH - 0.26, stitle, size=10, bold=True, color=WHITE)
    # subtitle
    txt(sx + sw/2, PY + 0.68, ssub, size=9, color=MUTED)
    # badge
    if sbadge:
        rect(sx + 0.2, PY + 0.14, sw - 0.4, 0.36, fc=sbc + "33", ec=sbc, lw=1.2, r=0.1)
        txt(sx + sw/2, PY + 0.32, sbadge, size=8.5, color=sbc)

# AuditReport fields
txt(15.1 + 6.5/2, PY + 1.0,
    "annotations  |  contradictions",
    size=8, color=MUTED)
txt(15.1 + 6.5/2, PY + 0.72,
    "faithfulness_score  |  risk_distribution",
    size=8, color=MUTED)

# ── Arrows between stages ─────────────────────────────────────────────────────
arrow_h(6.0, 6.5, CY, color=TEAL, lw=2.5)
arrow_h(10.6, 10.8, CY, color=TEAL, lw=2.5)
arrow_h(14.6, 15.1, CY, color=EMERALD, lw=2.5)

# ── ChromaDB feeds classifier (from below) ───────────────────────────────────
rect(6.5, 9.2, 3.8, 0.75, fc="#141e35", ec=INDIGO, lw=1.8, r=0.2)
txt(8.4, 9.575, "ChromaDB   (pre-built vector index)", size=9, bold=True, color=INDIGO)
arrow_v(8.4, 9.95, PY, color=INDIGO, lw=2)
txt(8.82, 10.25, "embeddings", size=8, color=INDIGO)

# ── Detail bullets ────────────────────────────────────────────────────────────
BULLETS = [
    (2.2,  INDIGO, ["pdfplumber extraction",
                    "noise filter (headers/TOC/nav)",
                    "sentence-boundary splitting",
                    "min 8 words per clause"]),
    (6.5,  PINK,   ["GPT-4o  |  temperature = 0",
                    "JSON schema enforced (json_object)",
                    "cited_text field required",
                    "4x retry on rate limit"]),
    (10.8, TEAL,   ["alignment: verbatim substring check",
                    "alignment: cosine sim fallback (0.65)",
                    "contradiction: cosine sim pairs >= 0.4",
                    "contradiction: top 30 pairs, scope-filtered"]),
    (15.1, EMERALD,["source_doc  |  total_clauses",
                    "flagged_count  |  annotations[]",
                    "faithfulness_score  |  risk_rating",
                    "risk_distribution  |  contradictions[]"]),
]

for (bx, ec, lines) in BULLETS:
    for j, line in enumerate(lines):
        txt(bx + 0.2, 9.05 - j * 0.33, "• " + line,
            size=8, color=MUTED, ha="left")

divider(7.75)


# ═════════════════════════════════════════════════════════════════════════════
# SECTION 3 — Evaluation Results  (y 0.5 – 7.35)
# ═════════════════════════════════════════════════════════════════════════════
section_bar(0, 7.3, 22, "SECTION 3  —  EVALUATION RESULTS  (51-clause NEU ground truth)", EMERALD)

# ── Accuracy comparison bars (left column) ────────────────────────────────────
txt(1.0, 6.9, "Classification Accuracy  —  4 Conditions", size=11,
    bold=True, color=WHITE, ha="left")

ACCURACY_ROWS = [
    ("Vanilla GPT-4o   (no structure, category names only)", 0.588, RED),
    ("Fine-tuned gpt-4o-mini   (AIRA prompt + fine-tuned)", 0.804, AMBER),
    ("GPT-4o base   (AIRA structured prompt, base model)",   0.863, INDIGO),
    ("AIRA Full Pipeline   (structured prompt, full eval)",  0.902, EMERALD),
]

BAR_X0   = 1.0
BAR_MAXW = 8.5
BAR_H    = 0.5
BAR_GAP  = 0.82
BAR_TOP  = 6.45

for i, (name, val, c) in enumerate(ACCURACY_ROWS):
    by = BAR_TOP - i * BAR_GAP
    # track
    rect(BAR_X0, by, BAR_MAXW, BAR_H, fc=PANEL, ec=BORDER, lw=0.8, r=0.1)
    # fill
    rect(BAR_X0, by, BAR_MAXW * val, BAR_H, fc=c + "55", ec=c, lw=1.5, r=0.1)
    # name
    txt(BAR_X0 - 0.1, by + BAR_H/2, name, size=8.5, color=WHITE, ha="right")
    # value
    txt(BAR_X0 + BAR_MAXW * val + 0.15, by + BAR_H/2,
        f"{val:.1%}", size=10, bold=True, color=c, ha="left")

# key insight callout
rect(1.0, 3.0, 8.5, 0.62, fc=INDIGO + "22", ec=INDIGO, lw=1.5)
txt(5.25, 3.31,
    "Structured prompting alone adds  +27.5 pp  (58.8%  ->  86.3%)",
    size=9.5, bold=True, color=INDIGO)

# ── Per-category table (right column) ─────────────────────────────────────────
TABLE_X = 11.5
txt(TABLE_X, 6.9, "Per-Category  (AIRA Full Pipeline)", size=11,
    bold=True, color=WHITE, ha="left")

# header row
rect(TABLE_X, 6.42, 10.0, 0.38, fc=PANEL, ec=BORDER, lw=1, r=0.1)
txt(TABLE_X + 3.6, 6.61, "Category",   size=9, bold=True, color=MUTED, ha="left")
txt(TABLE_X + 7.1, 6.61, "Precision",  size=9, bold=True, color=MUTED)
txt(TABLE_X + 8.8, 6.61, "Recall",     size=9, bold=True, color=MUTED)

CAT_DATA = [
    ("AIUsageLoophole",    1.00, 1.00, TEAL),
    ("CircularDefinition", 1.00, 1.00, TEAL),
    ("EnforcementGap",     1.00, 0.875, EMERALD),
    ("AuthorityConflict",  0.667, 1.00, INDIGO),
    ("Ambiguity",          1.00, 0.60, AMBER),
    ("UndefinedTerm",      1.00, 0.50, AMBER),
    ("None",               0.906, 0.967, MUTED),
    ("ScopeConflict",      0.00, 0.00, RED),
]

ROW_H   = 0.44
ROW_TOP = 6.02

for i, (cat, p, r, c) in enumerate(CAT_DATA):
    ry = ROW_TOP - i * ROW_H
    bg = PANEL if i % 2 == 0 else BG
    rect(TABLE_X, ry, 10.0, ROW_H, fc=bg, ec=BORDER + "66", lw=0.5, r=0.05)

    # colour swatch
    rect(TABLE_X + 0.1, ry + 0.1, 0.22, 0.24, fc=c, ec=c, lw=0, r=0.04)
    txt(TABLE_X + 0.5, ry + ROW_H/2, cat, size=9, color=WHITE, ha="left")

    # precision bar (mini)
    bx = TABLE_X + 6.2
    rect(bx, ry + 0.1, 1.4, 0.24, fc=BORDER, ec=BORDER, lw=0, r=0.04)
    if p > 0:
        rect(bx, ry + 0.1, 1.4 * p, 0.24, fc=c, ec=c, lw=0, r=0.04)
    txt(bx + 1.55, ry + ROW_H/2, f"{p:.0%}" if p > 0 else "—",
        size=9, color=c, ha="left")

    # recall bar (mini)
    bx2 = TABLE_X + 8.2
    rect(bx2, ry + 0.1, 1.4, 0.24, fc=BORDER, ec=BORDER, lw=0, r=0.04)
    if r > 0:
        rect(bx2, ry + 0.1, 1.4 * r, 0.24, fc=c, ec=c, lw=0, r=0.04)
    txt(bx2 + 1.55, ry + ROW_H/2, f"{r:.0%}" if r > 0 else "—",
        size=9, color=c, ha="left")

# ScopeConflict note
txt(TABLE_X, ROW_TOP - 8 * ROW_H - 0.1,
    "* ScopeConflict: zero ground truth examples — requires cross-clause reasoning (known limitation)",
    size=8, color=RED, ha="left")

# ── Footer ────────────────────────────────────────────────────────────────────
divider(0.55)
txt(11, 0.32,
    "github.com/rajesh1997r/academic-integrity-risk-analyzer   |   "
    "academic-integrity-risk-analyzer.vercel.app",
    size=8.5, color=INDIGO)


# ── Save ──────────────────────────────────────────────────────────────────────
out = Path("docs/architecture.png")
fig.savefig(out, dpi=150, bbox_inches="tight",
            facecolor=BG, edgecolor="none")
print(f"Saved -> {out}  ({out.stat().st_size // 1024} KB)")
plt.close(fig)
