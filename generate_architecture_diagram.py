"""Generate AIRA architecture diagram — outputs docs/architecture.png"""
from __future__ import annotations
from pathlib import Path
import matplotlib.pyplot as plt
import matplotlib.patches as mpatches
from matplotlib.patches import FancyBboxPatch, FancyArrowPatch

Path("docs").mkdir(exist_ok=True)

# ── Palette ──────────────────────────────────────────────────────────────────
C = {
    "bg":        "#0f172a",   # slate-950
    "panel":     "#1e293b",   # slate-800
    "border":    "#334155",   # slate-700
    "indigo":    "#6366f1",   # indigo-500
    "indigo_dk": "#4338ca",   # indigo-700
    "violet":    "#7c3aed",   # violet-700
    "teal":      "#0d9488",   # teal-600
    "emerald":   "#059669",   # emerald-600
    "amber":     "#d97706",   # amber-600
    "red":       "#dc2626",   # red-600
    "slate4":    "#94a3b8",   # slate-400
    "slate3":    "#cbd5e1",   # slate-300
    "white":     "#f8fafc",
}

fig = plt.figure(figsize=(20, 26), facecolor=C["bg"])
ax = fig.add_axes([0, 0, 1, 1])
ax.set_xlim(0, 20)
ax.set_ylim(0, 26)
ax.axis("off")
ax.set_facecolor(C["bg"])


# ── Helpers ───────────────────────────────────────────────────────────────────
def box(ax, x, y, w, h, fc, ec, radius=0.3, lw=1.5, alpha=1.0):
    p = FancyBboxPatch(
        (x, y), w, h,
        boxstyle=f"round,pad=0,rounding_size={radius}",
        facecolor=fc, edgecolor=ec, linewidth=lw, alpha=alpha, zorder=3,
    )
    ax.add_patch(p)
    return p


def label(ax, x, y, text, size=9, color=C["white"], weight="normal",
          ha="center", va="center", zorder=5):
    ax.text(x, y, text, fontsize=size, color=color, fontweight=weight,
            ha=ha, va=va, zorder=zorder,
            fontfamily="DejaVu Sans")


def arrow(ax, x1, y1, x2, y2, color=C["slate4"], lw=1.5,
          arrowstyle="-|>", mutation_scale=14):
    ax.annotate(
        "", xy=(x2, y2), xytext=(x1, y1),
        arrowprops=dict(
            arrowstyle=arrowstyle,
            color=color,
            lw=lw,
            mutation_scale=mutation_scale,
        ),
        zorder=4,
    )


def section_header(ax, x, y, w, text, color):
    box(ax, x, y, w, 0.55, fc=color, ec=color, radius=0.15)
    label(ax, x + w / 2, y + 0.275, text, size=9, weight="bold",
          color=C["white"])


# ═══════════════════════════════════════════════════════════════════════════════
# TITLE
# ═══════════════════════════════════════════════════════════════════════════════
label(ax, 10, 25.4, "AIRA — System Architecture",
      size=20, weight="bold", color=C["white"])
label(ax, 10, 25.0, "Academic Integrity Risk Analyzer  ·  INFO 7375 Generative AI Engineering",
      size=11, color=C["slate4"])

# divider
ax.plot([0.8, 19.2], [24.7, 24.7], color=C["border"], lw=1, zorder=3)


# ═══════════════════════════════════════════════════════════════════════════════
# SECTION 1 — Deployment Topology  (y: 22 – 24.4)
# ═══════════════════════════════════════════════════════════════════════════════
section_header(ax, 0.8, 24.15, 18.4, "① DEPLOYMENT TOPOLOGY", C["indigo_dk"])

# outer container
box(ax, 0.8, 22.05, 18.4, 1.9, fc=C["panel"], ec=C["border"], radius=0.4, lw=1)

# --- User browser ---
box(ax, 1.2, 22.35, 3.6, 1.3, fc="#1a2744", ec=C["indigo"], radius=0.25, lw=1.5)
label(ax, 3.0, 23.2, "[ User ] Browser", size=9.5, weight="bold", color=C["slate3"])
label(ax, 3.0, 22.9, "https://academic-integrity-", size=7.5, color=C["slate4"])
label(ax, 3.0, 22.65, "risk-analyzer.vercel.app", size=7.5, color=C["slate4"])

# --- Vercel ---
box(ax, 6.0, 22.35, 3.8, 1.3, fc="#1a1f3a", ec="#818cf8", radius=0.25, lw=1.5)
label(ax, 7.9, 23.25, "▲ Vercel CDN", size=9.5, weight="bold", color="#a5b4fc")
label(ax, 7.9, 22.95, "React SPA (Vite + Tailwind)", size=7.5, color=C["slate4"])
label(ax, 7.9, 22.68, "About · Demo · Upload · Eval", size=7.5, color=C["slate4"])

# --- Render ---
box(ax, 11.0, 22.35, 4.0, 1.3, fc="#1a2c1a", ec=C["emerald"], radius=0.25, lw=1.5)
label(ax, 13.0, 23.25, "⚙  Render (Free Tier)", size=9.5, weight="bold", color="#6ee7b7")
label(ax, 13.0, 22.95, "FastAPI  ·  Python 3.11", size=7.5, color=C["slate4"])
label(ax, 13.0, 22.68, "aira-api.onrender.com", size=7.5, color=C["slate4"])

# --- OpenAI ---
box(ax, 16.2, 22.35, 2.6, 1.3, fc="#261c2c", ec=C["violet"], radius=0.25, lw=1.5)
label(ax, 17.5, 23.25, "[ AI ] OpenAI", size=9.5, weight="bold", color="#c4b5fd")
label(ax, 17.5, 22.95, "GPT-4o", size=7.5, color=C["slate4"])
label(ax, 17.5, 22.68, "text-emb-3-small", size=7.5, color=C["slate4"])

# arrows
arrow(ax, 4.8, 23.0, 6.0, 23.0, color=C["indigo"], lw=1.8)
arrow(ax, 9.8, 23.0, 11.0, 23.0, color=C["indigo"], lw=1.8)
label(ax, 5.4, 23.2, "HTTPS", size=7, color=C["slate4"])
label(ax, 10.4, 23.2, "REST", size=7, color=C["slate4"])
arrow(ax, 15.0, 23.0, 16.2, 23.0, color=C["violet"], lw=1.8)
label(ax, 15.6, 23.2, "API", size=7, color=C["slate4"])

# cold-start note
label(ax, 10, 22.18, "⚠  Render free tier sleeps after 15 min inactivity — hit /health before demo",
      size=7.5, color=C["amber"])


# ═══════════════════════════════════════════════════════════════════════════════
# SECTION 2 — Pipeline Data Flow  (y: 14.5 – 21.8)
# ═══════════════════════════════════════════════════════════════════════════════
section_header(ax, 0.8, 21.7, 18.4, "② PIPELINE DATA FLOW", C["teal"])

# background panel
box(ax, 0.8, 14.7, 18.4, 6.8, fc=C["panel"], ec=C["border"], radius=0.4, lw=1)

PIPE_COLS = [2.0, 5.6, 9.2, 12.8]
PIPE_Y    = 17.3
BOX_W     = 3.0
BOX_H     = 5.2
ARROW_Y   = PIPE_Y + BOX_H / 2

STAGES = [
    {
        "title": "① ingestion.py",
        "color": C["indigo"],
        "inputs": ["PDF bytes (upload)", "or file path"],
        "outputs": ["List[Clause]"],
        "details": [
            "pdfplumber extraction",
            "noise filter regex",
            "sentence-boundary split",
            "min 8 words / clause",
        ],
        "badge": "No API calls",
        "badge_c": C["emerald"],
    },
    {
        "title": "② classifier.py",
        "color": "#e879f9",
        "inputs": ["List[Clause]"],
        "outputs": ["List[RiskAnnotation]"],
        "details": [
            "GPT-4o  temp=0",
            "json_object output",
            "8-category taxonomy",
            "cited_text enforced",
            "4× retry on rate limit",
        ],
        "badge": "~1 API call / clause",
        "badge_c": C["violet"],
    },
    {
        "title": "③ alignment.py",
        "color": C["teal"],
        "inputs": ["List[RiskAnnotation]"],
        "outputs": ["faithfulness_score", "low_conf flags"],
        "details": [
            "verbatim substring check",
            "cosine sim fallback",
            "threshold = 0.65",
            "flags low-conf annots",
        ],
        "badge": "No extra API calls",
        "badge_c": C["emerald"],
    },
    {
        "title": "④ contradiction.py",
        "color": C["amber"],
        "inputs": ["List[Clause]", "+ embeddings"],
        "outputs": ["List[Contradiction]"],
        "details": [
            "cosine sim ≥ 0.4",
            "top 30 pairs only",
            "GPT-4o pair check",
            "scope filter applied",
        ],
        "badge": "≤ 30 API calls",
        "badge_c": C["amber"],
    },
]

for i, (x, stage) in enumerate(zip(PIPE_COLS, STAGES)):
    ec = stage["color"]
    # main box
    box(ax, x, PIPE_Y, BOX_W, BOX_H, fc="#0f1a2e", ec=ec, radius=0.3, lw=2)

    # title bar
    box(ax, x, PIPE_Y + BOX_H - 0.65, BOX_W, 0.65,
        fc=ec + "33", ec=ec, radius=0.2, lw=1.5)
    label(ax, x + BOX_W / 2, PIPE_Y + BOX_H - 0.32,
          stage["title"], size=8.5, weight="bold", color=ec)

    # badge
    bc = stage["badge_c"]
    box(ax, x + 0.15, PIPE_Y + BOX_H - 1.15, BOX_W - 0.3, 0.38,
        fc=bc + "22", ec=bc, radius=0.1, lw=1)
    label(ax, x + BOX_W / 2, PIPE_Y + BOX_H - 0.97,
          stage["badge"], size=7, color=bc)

    # inputs label
    label(ax, x + BOX_W / 2, PIPE_Y + BOX_H - 1.55,
          "IN", size=6.5, color=C["slate4"], weight="bold")
    for j, inp in enumerate(stage["inputs"]):
        label(ax, x + BOX_W / 2, PIPE_Y + BOX_H - 1.82 - j * 0.22,
              inp, size=7, color=C["slate3"])

    # divider
    ax.plot([x + 0.2, x + BOX_W - 0.2],
            [PIPE_Y + BOX_H - 2.35, PIPE_Y + BOX_H - 2.35],
            color=C["border"], lw=0.8, zorder=4)

    # details
    for j, det in enumerate(stage["details"]):
        label(ax, x + 0.35, PIPE_Y + BOX_H - 2.65 - j * 0.32,
              f"• {det}", size=7.2, color=C["slate4"], ha="left")

    # outputs label
    label(ax, x + BOX_W / 2, PIPE_Y + 0.55,
          "OUT", size=6.5, color=C["slate4"], weight="bold")
    for j, out in enumerate(stage["outputs"]):
        label(ax, x + BOX_W / 2, PIPE_Y + 0.3 - j * 0.2,
              out, size=7, color=ec)

    # inter-stage arrows (except after last)
    if i < len(STAGES) - 1:
        arrow(ax, x + BOX_W, ARROW_Y, x + BOX_W + 0.6, ARROW_Y,
              color=C["slate4"], lw=2, mutation_scale=16)

# PDF input arrow (before stage 1)
arrow(ax, 0.8, ARROW_Y, PIPE_COLS[0], ARROW_Y,
      color=C["slate3"], lw=2, mutation_scale=16)
label(ax, 1.4, ARROW_Y + 0.28, "PDF", size=8, color=C["slate3"], weight="bold")

# AuditReport assembly box
box(ax, 7.2, 15.05, 5.6, 1.35, fc="#0f2028", ec=C["teal"], radius=0.25, lw=2)
label(ax, 10.0, 15.98, "AuditReport  (models.py)", size=9.5, weight="bold",
      color=C["teal"])
fields = "source_doc · total_clauses · flagged_count · annotations · contradictions · faithfulness_score · overall_risk_rating · risk_distribution"
label(ax, 10.0, 15.65, fields, size=7, color=C["slate4"])
label(ax, 10.0, 15.35, "→ JSON response → FastAPI → React frontend", size=7.5,
      color=C["slate3"])

# arrows down to AuditReport
for cx in [3.5, 7.1, 10.7, 14.3]:
    arrow(ax, cx, PIPE_Y, cx, 16.4, color=C["teal"], lw=1.2, mutation_scale=10)


# ═══════════════════════════════════════════════════════════════════════════════
# SECTION 3 — Storage & External Services  (y: 11.3 – 14.3)
# ═══════════════════════════════════════════════════════════════════════════════
section_header(ax, 0.8, 14.35, 18.4, "③ STORAGE & EXTERNAL SERVICES", C["indigo_dk"])

box(ax, 0.8, 11.3, 18.4, 2.85, fc=C["panel"], ec=C["border"], radius=0.4, lw=1)

STORE_BOXES = [
    {"x": 1.2, "w": 3.8, "title": "ChromaDB", "sub": "In-process vector store",
     "lines": ["Pre-built index committed to repo",
               "3 collections: NEU · Harvard · MIT",
               "text-embedding-3-small",
               "Zero embedding cost at runtime"],
     "ec": "#818cf8", "fc": "#1a1f3a"},
    {"x": 5.5, "w": 3.8, "title": "demo_output.json", "sub": "Pre-computed NEU analysis",
     "lines": ["51 clauses · 21 flagged",
               "Served by GET /demo",
               "Zero API calls at demo time",
               "Cold-start mitigation"],
     "ec": C["emerald"], "fc": "#0f2218"},
    {"x": 9.8, "w": 3.8, "title": "data/ground_truth.json", "sub": "51 manually annotated clauses",
     "lines": ["NEU policy · human labels",
               "Used by evaluator.py",
               "Single-annotator (limitation)",
               "90.2% AIRA accuracy"],
     "ec": C["amber"], "fc": "#261c0a"},
    {"x": 14.1, "w": 4.7, "title": "Fine-tuned Model", "sub": "ft:gpt-4o-mini · DXBLUexI",
     "lines": ["80.4% accuracy · ~20× cheaper",
               "Trained on 86 examples",
               "Default for POST /analyze",
               "GPT-4o used for demo + eval"],
     "ec": C["violet"], "fc": "#1a0a26"},
]

for s in STORE_BOXES:
    box(ax, s["x"], 11.55, s["w"], 2.35, fc=s["fc"], ec=s["ec"],
        radius=0.2, lw=1.5)
    label(ax, s["x"] + s["w"] / 2, 13.6, s["title"],
          size=8.5, weight="bold", color=s["ec"])
    label(ax, s["x"] + s["w"] / 2, 13.3, s["sub"],
          size=7, color=C["slate4"])
    ax.plot([s["x"] + 0.15, s["x"] + s["w"] - 0.15], [13.1, 13.1],
            color=C["border"], lw=0.8, zorder=4)
    for j, line in enumerate(s["lines"]):
        label(ax, s["x"] + 0.3, 12.85 - j * 0.28, f"• {line}",
              size=7, color=C["slate4"], ha="left")


# ═══════════════════════════════════════════════════════════════════════════════
# SECTION 4 — API Endpoints  (y: 7.0 – 11.0)
# ═══════════════════════════════════════════════════════════════════════════════
section_header(ax, 0.8, 11.0, 18.4, "④ API ENDPOINTS  (FastAPI — Render)", C["teal"])

box(ax, 0.8, 7.0, 18.4, 3.85, fc=C["panel"], ec=C["border"], radius=0.4, lw=1)

ENDPOINTS = [
    ("GET",  "/health",          "Liveness check + index status",                C["emerald"]),
    ("GET",  "/demo",            "Pre-computed NEU AuditReport — zero API cost",  C["indigo"]),
    ("GET",  "/demo/harvard",    "Pre-computed Harvard AuditReport",              C["indigo"]),
    ("POST", "/analyze",         "PDF upload → full pipeline → AuditReport JSON", "#f472b6"),
    ("GET",  "/evaluation",      "Latest evaluation/results/*.json",              C["amber"]),
    ("GET",  "/finetune/status", "Fine-tune job metadata (static JSON)",          C["violet"]),
    ("GET",  "/finetune/compare","Base vs. fine-tuned accuracy comparison",       C["violet"]),
]

col_w = 18.4 / 2
for i, (method, path, desc, mc) in enumerate(ENDPOINTS):
    row = i // 2
    col = i % 2
    bx = 0.8 + col * col_w + 0.15
    by = 10.65 - row * 1.1
    bw = col_w - 0.3

    box(ax, bx, by, bw, 0.82, fc="#0f1a2e", ec=mc + "66", radius=0.15, lw=1)

    method_c = C["emerald"] if method == "GET" else "#f472b6"
    box(ax, bx + 0.1, by + 0.22, 0.65, 0.38,
        fc=method_c + "22", ec=method_c, radius=0.08, lw=1)
    label(ax, bx + 0.42, by + 0.41, method, size=6.5, weight="bold", color=method_c)

    label(ax, bx + 0.9, by + 0.58, path, size=8, weight="bold",
          color=mc, ha="left")
    label(ax, bx + 0.9, by + 0.28, desc, size=7, color=C["slate4"], ha="left")


# ═══════════════════════════════════════════════════════════════════════════════
# SECTION 5 — Evaluation & Results  (y: 2.0 – 6.7)
# ═══════════════════════════════════════════════════════════════════════════════
section_header(ax, 0.8, 6.7, 18.4, "⑤ EVALUATION RESULTS", C["emerald"])

box(ax, 0.8, 2.0, 18.4, 4.55, fc=C["panel"], ec=C["border"], radius=0.4, lw=1)

# Accuracy bars
BARS = [
    ("Vanilla GPT-4o",             0.588, C["red"]),
    ("Fine-tuned gpt-4o-mini",     0.804, C["amber"]),
    ("GPT-4o (AIRA prompt, base)", 0.863, C["indigo"]),
    ("AIRA Full Pipeline",         0.902, C["emerald"]),
]

bar_x0 = 1.2
bar_y0 = 5.9
bar_max_w = 5.5
bar_h = 0.42
bar_gap = 0.62

label(ax, 1.2, 6.45, "Classification Accuracy (51-clause NEU ground truth)",
      size=8.5, weight="bold", color=C["slate3"], ha="left")

for i, (name, val, c) in enumerate(BARS):
    by = bar_y0 - i * bar_gap
    # background track
    box(ax, bar_x0, by, bar_max_w, bar_h,
        fc="#0f172a", ec=C["border"], radius=0.1, lw=0.8)
    # filled bar
    bw = bar_max_w * val
    box(ax, bar_x0, by, bw, bar_h,
        fc=c + "55", ec=c, radius=0.1, lw=1.5)
    # label
    label(ax, bar_x0 - 0.1, by + bar_h / 2, name,
          size=7.5, color=C["slate3"], ha="right")
    label(ax, bar_x0 + bw + 0.12, by + bar_h / 2,
          f"{val:.1%}", size=8, weight="bold", color=c, ha="left")

# Per-category table
TABLE_X = 8.0
TABLE_Y = 6.42

label(ax, TABLE_X, TABLE_Y, "Per-Category (AIRA Full Pipeline)",
      size=8.5, weight="bold", color=C["slate3"], ha="left")

CATS = [
    ("AIUsageLoophole",  1.00, 1.00, C["teal"]),
    ("CircularDefinition", 1.00, 1.00, C["teal"]),
    ("EnforcementGap",   1.00, 0.875, C["indigo"]),
    ("AuthorityConflict",0.667, 1.00, C["indigo"]),
    ("Ambiguity",        1.00, 0.60, C["amber"]),
    ("UndefinedTerm",    1.00, 0.50, C["amber"]),
    ("None",             0.906, 0.967, C["slate4"]),
    ("ScopeConflict",    0.00, 0.00, C["red"]),
]

# header
label(ax, TABLE_X + 2.9, TABLE_Y - 0.28, "Precision",
      size=7, color=C["slate4"], weight="bold", ha="right")
label(ax, TABLE_X + 4.0, TABLE_Y - 0.28, "Recall",
      size=7, color=C["slate4"], weight="bold", ha="right")

for i, (cat, p, r, c) in enumerate(CATS):
    ry = TABLE_Y - 0.58 - i * 0.42
    if i % 2 == 0:
        box(ax, TABLE_X - 0.1, ry - 0.12, 4.7, 0.38,
            fc=C["bg"], ec="none", radius=0.05, lw=0, alpha=0.5)
    label(ax, TABLE_X, ry + 0.06, f"• {cat}", size=7.5, color=c, ha="left")
    pval = f"{p:.0%}" if p > 0 else "—"
    rval = f"{r:.0%}" if r > 0 else "—"
    label(ax, TABLE_X + 2.9, ry + 0.06, pval, size=7.5, color=c, ha="right")
    label(ax, TABLE_X + 4.0, ry + 0.06, rval, size=7.5, color=c, ha="right")

# Key metrics summary
MX = 13.5
MY = 6.42
label(ax, MX, MY, "Key Metrics", size=8.5, weight="bold",
      color=C["slate3"], ha="left")

METRICS = [
    ("Overall accuracy",    "90.2%  (46/51)",           C["emerald"]),
    ("Faithfulness score",  "100%  (verbatim citations)", C["emerald"]),
    ("Hallucination rate",  "0.0%  (adversarial set)*",  C["amber"]),
    ("Vanilla baseline",    "58.8%  → +27.5pp from structure", C["indigo"]),
    ("Fine-tuned mini",     "80.4%  · ~20× cheaper",    C["violet"]),
    ("Worst category",      "ScopeConflict  0% P / 0% R", C["red"]),
]

for i, (k, v, c) in enumerate(METRICS):
    my = MY - 0.6 - i * 0.55
    box(ax, MX - 0.1, my - 0.1, 6.4, 0.42,
        fc=c + "11", ec=c + "44", radius=0.1, lw=0.8)
    label(ax, MX + 0.05, my + 0.1, k + ":", size=7.5,
          color=C["slate4"], ha="left")
    label(ax, MX + 0.05, my - 0.16, v, size=8, weight="bold",
          color=c, ha="left")

label(ax, MX, MY - 3.9,
      "* adversarial human review gate (human_accepted) not completed",
      size=6.5, color=C["amber"], ha="left")


# ═══════════════════════════════════════════════════════════════════════════════
# Footer
# ═══════════════════════════════════════════════════════════════════════════════
ax.plot([0.8, 19.2], [1.75, 1.75], color=C["border"], lw=0.8, zorder=3)
label(ax, 10, 1.45,
      "INFO 7375 Generative AI Engineering  ·  Northeastern University  ·  Spring 2026",
      size=8, color=C["slate4"])
label(ax, 10, 1.1,
      "github.com/rajesh1997r/academic-integrity-risk-analyzer  ·  "
      "academic-integrity-risk-analyzer.vercel.app",
      size=7.5, color=C["indigo"])


# ─── Save ─────────────────────────────────────────────────────────────────────
out = Path("docs/architecture.png")
fig.savefig(out, dpi=150, bbox_inches="tight",
            facecolor=C["bg"], edgecolor="none")
print(f"Saved → {out}  ({out.stat().st_size // 1024} KB)")
plt.close(fig)
