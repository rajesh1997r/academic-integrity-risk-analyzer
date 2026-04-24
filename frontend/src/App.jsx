import { useState, useEffect } from 'react'
import DemoView from './views/DemoView'
import UploadView from './views/UploadView'
import EvaluationDashboard from './components/EvaluationDashboard'

/* ─── Shared icon primitives ─── */
function ShieldIcon({ className }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
      <path strokeLinecap="round" strokeLinejoin="round"
        d="M9 12.75 11.25 15 15 9.75m-3-7.036A11.959 11.959 0 0 1 3.598 6
           11.99 11.99 0 0 0 3 9.749c0 5.592 3.824 10.29 9 11.623
           5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152
           c-3.196 0-6.1-1.248-8.25-3.285z" />
    </svg>
  )
}

const TABS = ['About', 'Demo', 'Upload', 'Evaluation']

const TAXONOMY = [
  { label: 'Ambiguity',          color: 'bg-indigo-100 text-indigo-800',  border: 'border-l-indigo-400',  desc: 'Language open to multiple interpretations — e.g., "appropriate use" without definition.' },
  { label: 'UndefinedTerm',      color: 'bg-yellow-100 text-yellow-800',  border: 'border-l-yellow-400',  desc: 'Key term used without definition — e.g., "AI tools" not scoped to specific systems.' },
  { label: 'EnforcementGap',     color: 'bg-red-100 text-red-800',        border: 'border-l-red-400',     desc: 'Prohibition exists but no detection or consequence mechanism is specified.' },
  { label: 'ScopeConflict',      color: 'bg-purple-100 text-purple-800',  border: 'border-l-purple-400',  desc: 'Clause applies inconsistently across contexts — e.g., different rules for graduate vs. undergraduate.' },
  { label: 'AuthorityConflict',  color: 'bg-blue-100 text-blue-800',      border: 'border-l-blue-400',    desc: 'Ambiguous jurisdiction — multiple offices named without clear decision hierarchy.' },
  { label: 'AIUsageLoophole',    color: 'bg-teal-100 text-teal-800',      border: 'border-l-teal-400',    desc: 'AI use permitted or prohibited without a defined boundary for what counts as AI.' },
  { label: 'CircularDefinition', color: 'bg-orange-100 text-orange-800',  border: 'border-l-orange-400',  desc: 'Definition references the term being defined, providing no real constraint.' },
]

/* ─── Animated analysis orb ─── */
function AnalysisOrb() {
  return (
    <div className="relative w-[380px] h-[380px] select-none">
      {/* Ambient glow */}
      <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
        <div className="w-72 h-72 rounded-full bg-indigo-500/15 blur-3xl animate-pulse" />
      </div>

      <svg viewBox="0 0 380 380" xmlns="http://www.w3.org/2000/svg" className="w-full h-full relative z-10">
        <defs>
          <radialGradient id="orb-fill" cx="36%" cy="30%" r="68%">
            <stop offset="0%"   stopColor="#4338ca" />
            <stop offset="42%"  stopColor="#1e1b4b" />
            <stop offset="100%" stopColor="#020617" />
          </radialGradient>
          <radialGradient id="orb-shine" cx="34%" cy="28%" r="44%">
            <stop offset="0%"   stopColor="white" stopOpacity="0.14" />
            <stop offset="100%" stopColor="white" stopOpacity="0" />
          </radialGradient>
          <filter id="dot-glow">
            <feGaussianBlur stdDeviation="1.8" result="b"/>
            <feMerge><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge>
          </filter>
        </defs>

        {/* Faint outer dashed ring */}
        <circle cx="190" cy="190" r="178" fill="none" stroke="#6366f1"
          strokeWidth="0.6" strokeOpacity="0.12" strokeDasharray="4 8" />

        {/* Orbital path 1 — equatorial tilt */}
        <ellipse cx="190" cy="190" rx="155" ry="45"
          fill="none" stroke="#6366f1" strokeWidth="0.8" strokeOpacity="0.28" />

        {/* Orbital path 2 — ~55 deg tilt */}
        <ellipse cx="190" cy="190" rx="130" ry="50"
          fill="none" stroke="#8b5cf6" strokeWidth="0.8" strokeOpacity="0.20"
          transform="rotate(55 190 190)" />

        {/* Orbital path 3 — counter-tilt */}
        <ellipse cx="190" cy="190" rx="105" ry="38"
          fill="none" stroke="#14b8a6" strokeWidth="0.8" strokeOpacity="0.20"
          transform="rotate(-35 190 190)" />

        {/* Main sphere */}
        <circle cx="190" cy="190" r="115" fill="url(#orb-fill)" />
        <circle cx="190" cy="190" r="115" fill="url(#orb-shine)" />

        {/* Sphere latitude lines */}
        <ellipse cx="190" cy="190" rx="115" ry="32"
          fill="none" stroke="white" strokeWidth="0.4" strokeOpacity="0.07" />
        <ellipse cx="190" cy="190" rx="115" ry="68"
          fill="none" stroke="white" strokeWidth="0.3" strokeOpacity="0.05" />

        {/* Dot A — orbit 1, forward */}
        <circle r="5" fill="#818cf8" filter="url(#dot-glow)">
          <animateMotion dur="7s" repeatCount="indefinite"
            path="M 345 190 A 155 45 0 1 1 35 190 A 155 45 0 1 1 345 190" />
        </circle>

        {/* Dot B — orbit 1, offset by half-period */}
        <circle r="3.5" fill="#a5b4fc" filter="url(#dot-glow)">
          <animateMotion dur="7s" repeatCount="indefinite" begin="-3.5s"
            path="M 345 190 A 155 45 0 1 1 35 190 A 155 45 0 1 1 345 190" />
        </circle>

        {/* Dot C — orbit 2 (tilted frame) */}
        <g transform="rotate(55 190 190)">
          <circle r="4.5" fill="#c4b5fd" filter="url(#dot-glow)">
            <animateMotion dur="10s" repeatCount="indefinite" begin="-2s"
              path="M 320 190 A 130 50 0 1 1 60 190 A 130 50 0 1 1 320 190" />
          </circle>
        </g>

        {/* Dot D — orbit 3 (counter-tilt frame) */}
        <g transform="rotate(-35 190 190)">
          <circle r="3.5" fill="#5eead4" filter="url(#dot-glow)">
            <animateMotion dur="8.5s" repeatCount="indefinite" begin="-1s"
              path="M 295 190 A 105 38 0 1 1 85 190 A 105 38 0 1 1 295 190" />
          </circle>
        </g>
      </svg>

      {/* Floating risk-category chips */}
      <span className="absolute top-10 right-3 text-[10px] font-mono text-indigo-300/80 bg-indigo-950/70 border border-indigo-700/50 px-2 py-0.5 rounded animate-fade-in-up delay-400">
        AIUsageLoophole
      </span>
      <span className="absolute bottom-16 left-1 text-[10px] font-mono text-red-300/80 bg-red-950/70 border border-red-700/50 px-2 py-0.5 rounded animate-fade-in-up delay-500">
        EnforcementGap
      </span>
      <span className="absolute top-[38%] left-0 text-[10px] font-mono text-violet-300/80 bg-violet-950/70 border border-violet-700/50 px-2 py-0.5 rounded animate-fade-in-up delay-300">
        Ambiguity
      </span>
      <span className="absolute bottom-10 right-10 text-[10px] font-mono text-teal-300/80 bg-teal-950/70 border border-teal-700/50 px-2 py-0.5 rounded animate-fade-in-up delay-400">
        ScopeConflict
      </span>
    </div>
  )
}

/* ─── About landing page ─── */
function AboutTab({ onNavigate }) {
  return (
    <div>
      {/* ── Hero ── */}
      <section className="bg-slate-950 line-grid relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-indigo-950/40 to-transparent pointer-events-none" />
        <div className="relative max-w-7xl mx-auto px-6 md:px-10 py-14 md:py-20">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 items-center">
            {/* Left — text */}
            <div className="animate-fade-in-up">
              <span className="inline-flex items-center gap-2 text-xs font-semibold tracking-widest uppercase text-indigo-400 bg-indigo-950/60 border border-indigo-800/60 rounded-full px-3 py-1.5 mb-8">
                INFO7375: Prompt Engineering and AI · Northeastern University
              </span>
              <h1 className="text-5xl md:text-6xl font-extrabold tracking-tight leading-[1.08] text-white mb-6">
                Bringing Clarity to{' '}
                <span className="bg-gradient-to-r from-indigo-300 via-violet-300 to-indigo-200 bg-clip-text text-transparent">
                  Academic Integrity
                </span>{' '}
                Policies
              </h1>
              <p className="text-lg text-slate-400 leading-relaxed mb-10">
                AIRA audits university policy PDFs for clauses that are ambiguous, unenforced, or open to
                AI-era exploitation — combining GPT-4o classification with vector-store RAG and grounded
                faithfulness scoring. Every finding cites the exact source text.
              </p>
              <div className="flex flex-wrap gap-4">
                <button
                  onClick={() => onNavigate('Demo')}
                  className="inline-flex items-center gap-2 bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-semibold px-6 py-3 rounded-lg transition-colors"
                >
                  View Demo Analysis
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5 21 12m0 0-7.5 7.5M21 12H3" />
                  </svg>
                </button>
                <button
                  onClick={() => onNavigate('Upload')}
                  className="inline-flex items-center gap-2 bg-white/5 hover:bg-white/10 text-white text-sm font-semibold px-6 py-3 rounded-lg border border-white/15 hover:border-white/25 transition-all"
                >
                  Analyze Your Policy
                </button>
              </div>
            </div>

            {/* Right — animated orb */}
            <div className="hidden lg:flex items-center justify-center animate-fade-in delay-200">
              <AnalysisOrb />
            </div>
          </div>

          {/* Stats */}
          <div className="mt-12 pt-8 border-t border-slate-800 grid grid-cols-2 sm:grid-cols-4 gap-6 animate-fade-in-up delay-300">
            {[
              { n: '3',      l: 'Universities Analyzed' },
              { n: '549',    l: 'Clauses Processed' },
              { n: '8',      l: 'Risk Categories' },
              { n: '90.2%',  l: 'Classification Accuracy' },
            ].map(({ n, l }) => (
              <div key={l}>
                <p className="text-3xl font-bold text-white">{n}</p>
                <p className="text-sm text-slate-400 mt-1">{l}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Evaluator's Guide ── */}
      <section className="bg-indigo-950 py-14">
        <div className="max-w-7xl mx-auto px-6 md:px-10">
          <div className="mb-8">
            <span className="inline-block text-xs font-semibold tracking-widest uppercase text-amber-300 bg-amber-900/40 border border-amber-700/50 rounded-full px-3 py-1.5 mb-4">
              Get Started · INFO7375
            </span>
            <h2 className="text-2xl md:text-3xl font-extrabold text-white">How to run this project</h2>
            <p className="mt-2 text-slate-400 text-sm">Four steps to explore everything AIRA can do — no setup needed.</p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="rounded-xl border border-indigo-800/60 bg-indigo-900/40 p-5">
              <div className="w-8 h-8 rounded-full bg-indigo-700 text-indigo-100 flex items-center justify-center text-sm font-bold mb-4">1</div>
              <h3 className="text-base font-bold text-white mb-2">Demo Tab</h3>
              <p className="text-sm text-slate-400 leading-relaxed mb-3">Pre-computed analysis of the NEU Academic Integrity Policy. See the risk scorecard, clause table, and contradiction pairs — zero API calls.</p>
              <span className="text-[10px] font-semibold tracking-widest uppercase text-indigo-300 bg-indigo-900/60 border border-indigo-700/50 rounded-full px-2.5 py-1">Prompt Engineering · RAG</span>
            </div>
            <div className="rounded-xl border border-violet-800/60 bg-violet-900/40 p-5">
              <div className="w-8 h-8 rounded-full bg-violet-700 text-violet-100 flex items-center justify-center text-sm font-bold mb-4">2</div>
              <h3 className="text-base font-bold text-white mb-2">Upload Tab</h3>
              <p className="text-sm text-slate-400 leading-relaxed mb-3">Upload any academic policy PDF. Runs the live pipeline: ingestion → ChromaDB query → GPT-4o classification → faithfulness scoring.</p>
              <span className="text-[10px] font-semibold tracking-widest uppercase text-violet-300 bg-violet-900/60 border border-violet-700/50 rounded-full px-2.5 py-1">Live Pipeline</span>
            </div>
            <div className="rounded-xl border border-purple-800/60 bg-purple-900/40 p-5">
              <div className="w-8 h-8 rounded-full bg-purple-700 text-purple-100 flex items-center justify-center text-sm font-bold mb-4">3</div>
              <h3 className="text-base font-bold text-white mb-2">Evaluation Tab</h3>
              <p className="text-sm text-slate-400 leading-relaxed mb-3">90.2% accuracy on 51 annotated clauses. Includes the vanilla baseline (58.8%) — structured prompting adds +27.5pp. Fine-tuning comparison included.</p>
              <span className="text-[10px] font-semibold tracking-widest uppercase text-purple-300 bg-purple-900/60 border border-purple-700/50 rounded-full px-2.5 py-1">Evaluation · Fine-Tuning</span>
            </div>
            <div className="relative rounded-xl border border-teal-800/60 bg-teal-900/40 p-5">
              <div className="w-8 h-8 rounded-full bg-teal-700 text-teal-100 flex items-center justify-center text-sm font-bold mb-4">4</div>
              <h3 className="text-base font-bold text-white mb-2">GitHub Repo</h3>
              <p className="text-sm text-slate-400 leading-relaxed mb-3">System Design Document, IMRaD technical paper, architecture diagram, and boondoggle score (21/25). See README.md.</p>
              <span className="text-[10px] font-semibold tracking-widest uppercase text-teal-300 bg-teal-900/60 border border-teal-700/50 rounded-full px-2.5 py-1">Documentation</span>
              <a href="https://github.com/rajesh1997r/academic-integrity-risk-analyzer" target="_blank" rel="noopener noreferrer"
                className="absolute top-5 right-5 text-teal-400 hover:text-teal-200 transition-colors">
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 6H5.25A2.25 2.25 0 0 0 3 8.25v10.5A2.25 2.25 0 0 0 5.25 21h10.5A2.25 2.25 0 0 0 18 18.75V10.5m-10.5 6L21 3m0 0h-5.25M21 3v5.25" />
                </svg>
              </a>
            </div>
          </div>
        </div>
      </section>

      {/* ── The Challenge ── */}
      <section className="bg-slate-50 py-20 md:py-28">
        <div className="max-w-7xl mx-auto px-6 md:px-10">
          <div className="mb-12">
            <p className="text-xs font-semibold tracking-widest uppercase text-indigo-600 mb-3">The Challenge</p>
            <h2 className="text-3xl md:text-4xl font-extrabold tracking-tight text-slate-900 max-w-2xl">
              Most academic policies weren't designed for the AI era
            </h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[
              {
                title: 'Ambiguous Language',
                body: 'Terms like "unauthorized assistance" or "appropriate use" are never defined with precision. Instructors interpret them differently; students exploit the gaps.',
                icon: (
                  <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0z" />
                  </svg>
                ),
              },
              {
                title: 'Enforcement Gaps',
                body: 'A prohibition with no stated detection mechanism or consequence is unenforceable in practice. AIRA flags every clause where the "what" exists but the "how" is absent.',
                icon: (
                  <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z" />
                  </svg>
                ),
              },
              {
                title: 'AI Loopholes',
                body: 'Policies written before 2020 don\'t mention generative AI. Those written after often permit or prohibit "AI tools" without defining what that means — creating exploitable loopholes.',
                icon: (
                  <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 10.5V6.75a4.5 4.5 0 1 1 9 0v3.75M3.75 21.75h10.5a2.25 2.25 0 0 0 2.25-2.25v-6.75a2.25 2.25 0 0 0-2.25-2.25H3.75a2.25 2.25 0 0 0-2.25 2.25v6.75a2.25 2.25 0 0 0 2.25 2.25z" />
                  </svg>
                ),
              },
            ].map(({ title, body, icon }) => (
              <div key={title} className="bg-white rounded-2xl border border-slate-200 p-7 shadow-sm hover:-translate-y-0.5 hover:shadow-md transition-all duration-200">
                <div className="w-11 h-11 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center mb-5">
                  {icon}
                </div>
                <h3 className="text-base font-bold text-slate-900 mb-2">{title}</h3>
                <p className="text-sm text-slate-500 leading-relaxed">{body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── How It Works ── */}
      <section className="bg-white py-20 md:py-28">
        <div className="max-w-7xl mx-auto px-6 md:px-10">
          <div className="mb-12">
            <p className="text-xs font-semibold tracking-widest uppercase text-indigo-600 mb-3">Pipeline</p>
            <h2 className="text-3xl md:text-4xl font-extrabold tracking-tight text-slate-900 max-w-2xl">
              A structured audit pipeline, not a summarizer
            </h2>
            <p className="mt-4 text-base text-slate-500 max-w-2xl leading-relaxed">
              Every finding is grounded in verbatim source text. Faithfulness scoring prevents the model
              from silently hallucinating citations.
            </p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
            {[
              {
                step: '01', title: 'Ingestion',
                body: 'pdfplumber extracts text and splits it into clause-level segments. Noise filters remove headers, footers, and table-of-contents entries. UUID, page number, and position index are assigned per clause.',
                gradient: 'from-indigo-300 via-indigo-400 to-indigo-700',
                shadow:   'text-indigo-900',
                glow:     'bg-indigo-500',
                floatCls: 'animate-float',
              },
              {
                step: '02', title: 'Classification',
                body: 'GPT-4o classifies each clause with a primary risk label from the 8-category taxonomy, an optional secondary label, a reasoning chain, and a verbatim cited_text excerpt. Temperature is fixed at 0 for determinism.',
                gradient: 'from-violet-300 via-violet-400 to-violet-700',
                shadow:   'text-violet-900',
                glow:     'bg-violet-500',
                floatCls: 'animate-float-delay-1',
              },
              {
                step: '03', title: 'Faithfulness Scoring',
                body: 'Containment-first: if cited_text literally appears in the clause, score = 1.0. Otherwise, cosine similarity between their text-embedding-3-small vectors is computed. Scores below 0.65 raise a low-confidence flag.',
                gradient: 'from-purple-300 via-purple-400 to-purple-700',
                shadow:   'text-purple-900',
                glow:     'bg-purple-500',
                floatCls: 'animate-float-delay-2',
              },
              {
                step: '04', title: 'Contradiction Detection',
                body: 'Each clause is queried against ChromaDB for its top-5 semantic neighbors. Clause pairs with similarity above 0.4 are re-examined by GPT-4o for PermissionConflict, ScopeOverlap, PunishmentConflict, or PolicyGap.',
                gradient: 'from-teal-300 via-teal-400 to-teal-700',
                shadow:   'text-teal-900',
                glow:     'bg-teal-500',
                floatCls: 'animate-float-delay-3',
              },
            ].map(({ step, title, body, gradient, shadow, glow, floatCls }) => (
              <div key={step} className="relative group">
                {/* 3-D number */}
                <div className="relative mb-6 h-24 select-none">
                  {/* Ambient glow disc behind the number */}
                  <div className={`absolute w-24 h-10 -left-1 top-6 blur-2xl opacity-35 rounded-full ${glow}`} />
                  {/* Offset shadow copy — gives depth */}
                  <span
                    className={`absolute text-8xl font-black leading-none opacity-20 blur-[1px] ${shadow}`}
                    style={{ top: '5px', left: '5px' }}
                    aria-hidden="true"
                  >
                    {step}
                  </span>
                  {/* Main gradient number with float */}
                  <span
                    className={`relative text-8xl font-black leading-none bg-gradient-to-br ${gradient} bg-clip-text text-transparent ${floatCls}`}
                  >
                    {step}
                  </span>
                </div>

                <h3 className="text-base font-bold text-slate-900 mb-2">{title}</h3>
                <p className="text-sm text-slate-500 leading-relaxed">{body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Course Competencies ── */}
      <section className="bg-indigo-50 py-20 md:py-28">
        <div className="max-w-7xl mx-auto px-6 md:px-10">
          <div className="mb-10">
            <p className="text-xs font-semibold tracking-widest uppercase text-indigo-600 mb-3">INFO7375: Prompt Engineering and AI</p>
            <h2 className="text-3xl md:text-4xl font-extrabold tracking-tight text-slate-900">
              Four competencies, all demonstrated
            </h2>
            <p className="mt-4 text-base text-slate-500 max-w-2xl leading-relaxed">
              Each core skill from the course is measured with real numbers, not just described.
            </p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            <div className="bg-white rounded-2xl border border-indigo-100 p-7 shadow-sm">
              <div className="flex items-center gap-3 mb-4">
                <span className="w-9 h-9 rounded-xl bg-indigo-600 text-white text-sm font-bold flex items-center justify-center shrink-0">01</span>
                <h3 className="text-base font-bold text-slate-900">Prompt Engineering</h3>
              </div>
              <p className="text-2xl font-extrabold text-indigo-700 mb-1">+27.5 pp accuracy gain</p>
              <p className="text-xs text-slate-400 mb-3">58.8% → 86.3% · same model, structured prompt only</p>
              <p className="text-sm text-slate-500 leading-relaxed">Taxonomy enforcement — category definitions, chain-of-thought, cited_text, JSON schema — raises classification accuracy by 27.5 percentage points over vanilla GPT-4o on the same 51-clause ground truth.</p>
              <p className="mt-3 text-xs text-indigo-600 font-medium">Evidence: Evaluation tab → Baseline Comparison</p>
            </div>
            <div className="bg-white rounded-2xl border border-violet-100 p-7 shadow-sm">
              <div className="flex items-center gap-3 mb-4">
                <span className="w-9 h-9 rounded-xl bg-violet-600 text-white text-sm font-bold flex items-center justify-center shrink-0">02</span>
                <h3 className="text-base font-bold text-slate-900">Retrieval-Augmented Generation</h3>
              </div>
              <p className="text-2xl font-extrabold text-violet-700 mb-1">Pre-built ChromaDB index</p>
              <p className="text-xs text-slate-400 mb-3">851 clause vectors · MIT, Harvard, NEU · zero runtime embedding cost</p>
              <p className="text-sm text-slate-500 leading-relaxed">text-embedding-3-small vectors for all 851 policy clauses are committed to the repo. Top-5 semantic neighbors are retrieved per clause at runtime to power contradiction detection and faithfulness scoring.</p>
              <p className="mt-3 text-xs text-violet-600 font-medium">Evidence: Demo tab → Contradiction Pairs section</p>
            </div>
            <div className="bg-white rounded-2xl border border-purple-100 p-7 shadow-sm">
              <div className="flex items-center gap-3 mb-4">
                <span className="w-9 h-9 rounded-xl bg-purple-600 text-white text-sm font-bold flex items-center justify-center shrink-0">03</span>
                <h3 className="text-base font-bold text-slate-900">Fine-Tuning</h3>
              </div>
              <p className="text-2xl font-extrabold text-purple-700 mb-1">80.4% at 25× lower cost</p>
              <p className="text-xs text-slate-400 mb-3">gpt-4o-mini · 86 labeled examples · −5.9pp vs GPT-4o base</p>
              <p className="text-sm text-slate-500 leading-relaxed">gpt-4o-mini fine-tuned on 69 training examples from the annotated dataset. Achieves 80.4% accuracy vs 86.3% for GPT-4o base — a viable low-cost production fallback at 25× lower inference cost.</p>
              <p className="mt-3 text-xs text-purple-600 font-medium">Evidence: Evaluation tab → Fine-Tuning section</p>
            </div>
            <div className="bg-white rounded-2xl border border-teal-100 p-7 shadow-sm">
              <div className="flex items-center gap-3 mb-4">
                <span className="w-9 h-9 rounded-xl bg-teal-600 text-white text-sm font-bold flex items-center justify-center shrink-0">04</span>
                <h3 className="text-base font-bold text-slate-900">Evaluation &amp; Metrics</h3>
              </div>
              <p className="text-2xl font-extrabold text-teal-700 mb-1">90.2% accuracy · 100% faithfulness</p>
              <p className="text-xs text-slate-400 mb-3">51-clause annotated ground truth · per-category P/R · confusion matrix</p>
              <p className="text-sm text-slate-500 leading-relaxed">51 manually-annotated NEU clauses as ground truth. Per-category precision and recall for all 8 categories. Faithfulness scored by verbatim citation containment. Adversarial synthetic set measures hallucination rate.</p>
              <p className="mt-3 text-xs text-teal-600 font-medium">Evidence: Evaluation tab → all three sections</p>
            </div>
          </div>
        </div>
      </section>

      {/* ── Risk Taxonomy ── */}
      <section className="bg-slate-50 py-20 md:py-28">
        <div className="max-w-7xl mx-auto px-6 md:px-10">
          <div className="mb-10">
            <p className="text-xs font-semibold tracking-widest uppercase text-indigo-600 mb-3">Risk Categories</p>
            <h2 className="text-3xl md:text-4xl font-extrabold tracking-tight text-slate-900">
              A structured taxonomy of policy risks
            </h2>
          </div>
          <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm">
            {TAXONOMY.map(({ label, color, border, desc }, i) => (
              <div
                key={label}
                className={`flex items-start gap-5 px-7 py-5 border-l-4 ${border} ${i < TAXONOMY.length - 1 ? 'border-b border-slate-100' : ''} hover:bg-slate-50 transition-colors`}
              >
                <span className={`mt-0.5 shrink-0 text-xs font-semibold px-2.5 py-1 rounded-full ${color}`}>{label}</span>
                <p className="text-sm text-slate-600 leading-relaxed">{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Technology Stack ── */}
      <section className="bg-white py-20 md:py-28">
        <div className="max-w-7xl mx-auto px-6 md:px-10">
          <div className="mb-10">
            <p className="text-xs font-semibold tracking-widest uppercase text-indigo-600 mb-3">Technology</p>
            <h2 className="text-3xl md:text-4xl font-extrabold tracking-tight text-slate-900">
              Built on proven AI infrastructure
            </h2>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {[
              { name: 'GPT-4o',                  role: 'Classification Engine',      detail: 'Zero-shot risk classification at temperature 0. Structured JSON output enforced via response_format for determinism.' },
              { name: 'text-embedding-3-small',  role: 'Semantic Embedding',         detail: '1536-dimensional embeddings for all policy clauses. Powers both contradiction detection and faithfulness scoring.' },
              { name: 'ChromaDB',                role: 'Vector Store',               detail: 'Persistent HNSW index pre-built from MIT, Harvard, and NEU policies. Queried at runtime — no re-embedding on upload.' },
              { name: 'FastAPI',                 role: 'Backend API',                detail: 'Async Python server deployed to Render. Endpoints: /analyze, /demo, /evaluation, /health. Structured Pydantic schemas throughout.' },
              { name: 'React + Vite',            role: 'Frontend',                   detail: 'Single-page app deployed to Vercel. Recharts for visualization. Tailwind CSS for styling. Hash-based routing for tab state.' },
              { name: 'Fine-tuned gpt-4o-mini',  role: 'Cost-Optimized Classifier',  detail: 'Fine-tuned on 86 labeled clauses (51 ground truth + 35 synthetic). 80.4% accuracy vs 86.3% for GPT-4o base — 25× cost reduction.' },
            ].map(({ name, role, detail }) => (
              <div key={name} className="bg-slate-50 rounded-2xl border border-slate-200 p-6 hover:-translate-y-0.5 hover:shadow-md transition-all duration-200">
                <p className="text-xs font-semibold tracking-wider uppercase text-indigo-600 mb-1">{role}</p>
                <h3 className="text-base font-bold text-slate-900 mb-2 font-mono">{name}</h3>
                <p className="text-sm text-slate-500 leading-relaxed">{detail}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Ethical Considerations ── */}
      <section className="bg-slate-50 py-20 md:py-28">
        <div className="max-w-7xl mx-auto px-6 md:px-10">
          <div className="mb-10">
            <p className="text-xs font-semibold tracking-widest uppercase text-indigo-600 mb-3">Responsible Use</p>
            <h2 className="text-3xl md:text-4xl font-extrabold tracking-tight text-slate-900">
              Designed with transparency in mind
            </h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {[
              {
                title: 'Not a Legal Tool',
                body: 'AIRA flags potential issues for human review — it does not determine whether a clause is legally valid or enforceable. Every output should be reviewed by a policy expert before any institutional action is taken.',
              },
              {
                title: 'Classifier Bias',
                body: 'GPT-4o may reflect biases in its training data toward certain interpretations of academic fairness. The prompt was calibrated on NEU, Harvard, and MIT policies — performance on institutions with different policy styles is untested.',
              },
              {
                title: 'Privacy and Data Handling',
                body: "Uploaded PDFs are sent to OpenAI's API for classification. Users should not upload documents containing student records (FERPA-protected) or proprietary institutional content without authorization.",
              },
              {
                title: 'Transparency by Design',
                body: 'Every flagged clause includes a verbatim cited_text and reasoning chain. Faithfulness scoring prevents silent hallucination. Confidence scores and low-confidence flags are always surfaced to the reader.',
              },
            ].map(({ title, body }) => (
              <div key={title} className="bg-white rounded-2xl border border-slate-200 p-7 shadow-sm">
                <h3 className="text-base font-bold text-slate-900 mb-2">{title}</h3>
                <p className="text-sm text-slate-500 leading-relaxed">{body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Known Limitations & Future Work ── */}
      <section className="bg-white py-20 md:py-28">
        <div className="max-w-7xl mx-auto px-6 md:px-10">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
            <div>
              <p className="text-xs font-semibold tracking-widest uppercase text-slate-400 mb-3">Limitations</p>
              <h2 className="text-2xl font-extrabold tracking-tight text-slate-900 mb-6">Known constraints</h2>
              <ul className="space-y-3">
                {[
                  'Sentence segmentation can split or merge clauses in heavily formatted PDFs with tables or dense bullet lists.',
                  'Very short clauses (under 15 words) are harder to classify reliably — confidence tends to be lower.',
                  'Contradiction detection only considers pairs with cosine similarity above 0.4; low-overlap contradictions are missed.',
                  'Upload is capped at 200 clauses per document to limit OpenAI API cost.',
                  'Free-tier Render deployment sleeps after 15 minutes of inactivity — first request after sleep takes ~30 seconds.',
                ].map((item, i) => (
                  <li key={i} className="flex gap-3 text-sm text-slate-500">
                    <span className="mt-1.5 w-1.5 h-1.5 rounded-full bg-slate-300 shrink-0" />
                    {item}
                  </li>
                ))}
              </ul>
            </div>
            <div>
              <p className="text-xs font-semibold tracking-widest uppercase text-indigo-600 mb-3">Roadmap</p>
              <h2 className="text-2xl font-extrabold tracking-tight text-slate-900 mb-6">Future directions</h2>
              <ul className="space-y-3">
                {[
                  'Cross-document contradiction detection in the Upload flow using the pre-built vector index.',
                  'Interactive clause editor: let policy authors fix flagged issues in-browser and re-analyze.',
                  'Export to PDF or DOCX with inline annotations for institutional reporting.',
                  'Multi-language support for policies written in Spanish, French, or Mandarin.',
                  'Version comparison: track how a policy\'s risk profile changes between annual revisions.',
                ].map((item, i) => (
                  <li key={i} className="flex gap-3 text-sm text-slate-500">
                    <span className="mt-0.5 text-indigo-400 shrink-0">
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5 21 12m0 0-7.5 7.5M21 12H3" />
                      </svg>
                    </span>
                    {item}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </section>
    </div>
  )
}

/* ─── Header ─── */
function Header({ activeTab, switchTab }) {
  return (
    <header className="fixed top-0 inset-x-0 z-50 bg-white/95 backdrop-blur-md border-b border-slate-100">
      <div className="max-w-7xl mx-auto px-6 md:px-10 h-16 flex items-center justify-between gap-6">

        {/* Brand — expanded */}
        <button
          onClick={() => switchTab('About')}
          className="flex items-center gap-3 shrink-0 group"
        >
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-indigo-500 to-violet-600 flex items-center justify-center shadow-md group-hover:shadow-indigo-200 transition-shadow">
            <ShieldIcon className="w-5 h-5 text-white" />
          </div>
          <div className="flex items-center gap-2.5">
            <span className="text-base font-extrabold bg-gradient-to-r from-indigo-600 to-violet-600 bg-clip-text text-transparent tracking-tight">
              AIRA
            </span>
            <span className="hidden lg:block w-px h-4 bg-slate-200" />
            <span className="hidden lg:block text-xs text-slate-400 font-medium">
              Academic Integrity Risk Analyzer
            </span>
          </div>
        </button>

        {/* Nav */}
        <nav className="flex items-center gap-0.5">
          {TABS.map((tab) => (
            <button
              key={tab}
              onClick={() => switchTab(tab)}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-all duration-150 ${
                activeTab === tab
                  ? 'bg-indigo-50 text-indigo-700 font-semibold'
                  : 'text-slate-500 hover:text-slate-900 hover:bg-slate-100'
              }`}
            >
              {tab}
            </button>
          ))}
        </nav>


      </div>
    </header>
  )
}

/* ─── Footer ─── */
function Footer({ switchTab }) {
  return (
    <footer className="bg-slate-950 text-slate-400">
      <div className="max-w-7xl mx-auto px-6 md:px-10 py-14">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-10 mb-10">
          <div>
            <div className="flex items-center gap-2.5 mb-4">
              <div className="w-7 h-7 rounded-md bg-indigo-600 flex items-center justify-center">
                <ShieldIcon className="w-3.5 h-3.5 text-white" />
              </div>
              <span className="text-sm font-bold text-white">AIRA</span>
            </div>
            <p className="text-sm leading-relaxed max-w-xs">
              Academic Integrity Risk Analyzer. Auditing university policy documents with GPT-4o and vector search.
            </p>
          </div>

          <div>
            <h4 className="text-xs font-semibold tracking-widest uppercase text-slate-300 mb-4">Navigation</h4>
            <ul className="space-y-2.5">
              {TABS.map((tab) => (
                <li key={tab}>
                  <button
                    onClick={() => switchTab(tab)}
                    className="text-sm hover:text-white transition-colors"
                  >
                    {tab}
                  </button>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h4 className="text-xs font-semibold tracking-widest uppercase text-slate-300 mb-4">Project</h4>
            <ul className="space-y-2.5 text-sm">
              <li>
                <a
                  href="https://github.com/rajesh1997r/academic-integrity-risk-analyzer"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="hover:text-white transition-colors inline-flex items-center gap-1.5"
                >
                  GitHub Repository
                  <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 6H5.25A2.25 2.25 0 0 0 3 8.25v10.5A2.25 2.25 0 0 0 5.25 21h10.5A2.25 2.25 0 0 0 18 18.75V10.5m-10.5 6L21 3m0 0h-5.25M21 3v5.25" />
                  </svg>
                </a>
              </li>
              <li>INFO7375: Prompt Engineering and AI</li>
              <li>Northeastern University · Spring 2026</li>
            </ul>
          </div>
        </div>

        <div className="border-t border-slate-800 pt-7 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-slate-500">
          <p>© 2026 AIRA · Academic Integrity Risk Analyzer · Northeastern University</p>
          <p>Powered by GPT-4o · ChromaDB · FastAPI · React</p>
        </div>
      </div>
    </footer>
  )
}

/* ─── Root ─── */
function tabFromHash() {
  const hash = window.location.hash.replace('#', '').toLowerCase()
  return TABS.find((t) => t.toLowerCase() === hash) || 'About'
}

export default function App() {
  const [activeTab, setActiveTab] = useState(tabFromHash)

  // Sync React state when the browser back/forward button changes the URL
  useEffect(() => {
    const onPop = () => {
      setActiveTab(tabFromHash())
      window.scrollTo({ top: 0, behavior: 'smooth' })
    }
    window.addEventListener('popstate', onPop)
    return () => window.removeEventListener('popstate', onPop)
  }, [])

  const switchTab = (tab) => {
    setActiveTab(tab)
    if (tab === 'About') {
      // pushState keeps a history entry so browser back works; clean URL (no hash)
      history.pushState(null, '', window.location.pathname)
    } else {
      window.location.hash = tab.toLowerCase()
    }
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      <Header activeTab={activeTab} switchTab={switchTab} />

      <main className="flex-1 pt-16">
        {activeTab === 'Demo'       && <DemoView />}
        {activeTab === 'Upload'     && <UploadView />}
        {activeTab === 'Evaluation' && (
          <div>
            <section className="bg-slate-950 line-grid relative overflow-hidden">
              <div className="absolute inset-0 bg-gradient-to-br from-violet-950/50 via-transparent to-transparent pointer-events-none" />
              <div className="relative max-w-7xl mx-auto px-6 md:px-10 py-14 md:py-16 animate-fade-in-up">
                <button
                  onClick={() => history.back()}
                  className="inline-flex items-center gap-1.5 text-xs text-slate-500 hover:text-slate-300 transition-colors mb-6 group"
                >
                  <svg className="w-3.5 h-3.5 group-hover:-translate-x-0.5 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 19.5 3 12m0 0 7.5-7.5M3 12h18" />
                  </svg>
                  Back
                </button>
                <p className="text-xs font-semibold tracking-widest uppercase text-violet-400 mb-4">
                  Model Performance
                </p>
                <h1 className="text-4xl md:text-5xl font-extrabold tracking-tight text-white mb-4">
                  Evaluation{' '}
                  <span className="bg-gradient-to-r from-violet-300 to-indigo-300 bg-clip-text text-transparent">
                    Dashboard
                  </span>
                </h1>
                <p className="text-base text-slate-400 max-w-xl leading-relaxed">
                  Classification accuracy, faithfulness scoring, and fine-tuning comparison between
                  GPT-4o base and the fine-tuned gpt-4o-mini model.
                </p>
              </div>
            </section>
            <div className="max-w-7xl mx-auto px-6 md:px-10 py-10">
              <EvaluationDashboard />
            </div>
          </div>
        )}
        {activeTab === 'About' && <AboutTab onNavigate={switchTab} />}
      </main>

      <Footer switchTab={switchTab} />
    </div>
  )
}
