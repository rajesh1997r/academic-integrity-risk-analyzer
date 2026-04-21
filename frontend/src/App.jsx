import { useState } from 'react'
import DemoView from './views/DemoView'
import UploadView from './views/UploadView'
import EvaluationDashboard from './components/EvaluationDashboard'

const TABS = ['Demo', 'Upload', 'Evaluation', 'About']

const TAXONOMY = [
  { label: 'Ambiguity', color: 'bg-yellow-100 text-yellow-800', desc: 'Language open to multiple interpretations — e.g., "appropriate use" without definition.' },
  { label: 'UndefinedTerm', color: 'bg-orange-100 text-orange-800', desc: 'Key term used without definition — e.g., "AI tools" not scoped to specific systems.' },
  { label: 'EnforcementGap', color: 'bg-red-100 text-red-800', desc: 'Prohibition exists but no detection or consequence mechanism is specified.' },
  { label: 'ScopeConflict', color: 'bg-purple-100 text-purple-800', desc: 'Clause applies inconsistently — e.g., different rules for undergrad vs graduate.' },
  { label: 'AuthorityConflict', color: 'bg-blue-100 text-blue-800', desc: 'Ambiguous jurisdiction — multiple offices named without clear decision hierarchy.' },
  { label: 'AIUsageLoophole', color: 'bg-pink-100 text-pink-800', desc: 'AI use permitted or prohibited without a defined boundary for what counts as AI.' },
  { label: 'CircularDefinition', color: 'bg-gray-100 text-gray-800', desc: 'Definition references the term being defined, providing no real constraint.' },
]

function PipelineStep({ icon, label, sub, arrow = true }) {
  return (
    <div className="flex items-center gap-2">
      <div className="flex flex-col items-center">
        <div className="w-14 h-14 rounded-xl bg-white border-2 border-indigo-200 shadow-sm flex flex-col items-center justify-center text-xl">
          {icon}
        </div>
        <span className="text-xs font-semibold text-gray-700 mt-1 text-center leading-tight w-16">{label}</span>
        {sub && <span className="text-[10px] text-gray-400 text-center w-16">{sub}</span>}
      </div>
      {arrow && <div className="text-indigo-300 text-xl font-light mb-4">→</div>}
    </div>
  )
}

function AboutTab() {
  return (
    <div className="max-w-4xl mx-auto py-8 space-y-10 text-gray-700">

      {/* Hero */}
      <div className="bg-gradient-to-r from-indigo-600 to-violet-600 rounded-2xl p-8 text-white">
        <h2 className="text-3xl font-bold mb-2">AIRA — Academic Integrity Risk Analyzer</h2>
        <p className="text-indigo-100 text-sm leading-relaxed max-w-2xl">
          AIRA audits university policy PDFs for clauses that are ambiguous, unenforced, or exploit AI loopholes —
          combining GPT-4o zero-shot classification with vector-store RAG and grounded faithfulness scoring.
          Built as a course final project for INFO 7375 Generative AI, Northeastern University, Spring 2026.
        </p>
      </div>

      {/* Architecture pipeline */}
      <section>
        <h3 className="text-lg font-bold text-gray-900 mb-4">System Architecture</h3>
        <div className="bg-white border border-gray-200 rounded-2xl p-6 shadow-sm overflow-x-auto">
          <div className="flex items-start gap-1 min-w-max">
            <PipelineStep icon="📄" label="PDF Input" sub="pdfplumber" />
            <PipelineStep icon="✂️" label="Ingestion" sub="sentence split" />
            <PipelineStep icon="🗄️" label="ChromaDB" sub="chroma 0.5" />
            <PipelineStep icon="🔍" label="RAG Query" sub="top-k = 5" />
            <PipelineStep icon="🤖" label="GPT-4o" sub="temp = 0" />
            <PipelineStep icon="📐" label="Faithfulness" sub="cosine sim" />
            <PipelineStep icon="⚡" label="FastAPI" sub="Render" />
            <PipelineStep icon="🌐" label="React UI" sub="Vercel" arrow={false} />
          </div>
          <div className="mt-4 grid grid-cols-3 gap-3 text-xs text-gray-600">
            <div className="bg-indigo-50 rounded-lg p-3">
              <span className="font-semibold text-indigo-700 block mb-1">Ingestion Layer</span>
              Splits PDF pages into paragraph blocks, applies noise filters (TOC entries, headers, footers,
              video timestamps, non-ASCII nav), then sentence-boundary splits. Minimum 8 words enforced.
              UUID assigned per clause with page number and position index.
            </div>
            <div className="bg-violet-50 rounded-lg p-3">
              <span className="font-semibold text-violet-700 block mb-1">Classification Layer</span>
              GPT-4o classifies each clause with a primary risk label, optional secondary label, reasoning
              chain, and a <em>cited_text</em> — a verbatim excerpt from the clause. Confidence &lt; 0.65
              triggers a low-confidence flag. Response schema is <code>json_object</code> for determinism.
            </div>
            <div className="bg-pink-50 rounded-lg p-3">
              <span className="font-semibold text-pink-700 block mb-1">Faithfulness Layer</span>
              Containment-first scoring: if <em>cited_text</em> is literally in the clause (case-insensitive),
              score = 1.0. Otherwise, cosine similarity between their <code>text-embedding-3-small</code> vectors
              is used. This prevents hallucinated citations from passing silently.
            </div>
          </div>
        </div>
      </section>

      {/* Technical component cards */}
      <section>
        <h3 className="text-lg font-bold text-gray-900 mb-4">Technical Components</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-white border border-gray-200 rounded-xl p-5 shadow-sm">
            <div className="text-2xl mb-2">💬</div>
            <h4 className="font-semibold text-gray-900 mb-2">Prompt Engineering</h4>
            <p className="text-sm text-gray-600 leading-relaxed">
              System prompt encodes the full 7-category risk taxonomy with negative examples — common academic
              phrases that should <em>not</em> trigger UndefinedTerm. Temperature 0 enforces determinism.
              The model is instructed to prefer <strong>None</strong> when uncertain, targeting 40–60%
              flagging rates to avoid over-labeling.
            </p>
          </div>
          <div className="bg-white border border-gray-200 rounded-xl p-5 shadow-sm">
            <div className="text-2xl mb-2">🗄️</div>
            <h4 className="font-semibold text-gray-900 mb-2">RAG (Vector Store)</h4>
            <p className="text-sm text-gray-600 leading-relaxed">
              All three policy documents are pre-embedded with <code>text-embedding-3-small</code> (1536-dim)
              and stored in ChromaDB persistent collections. At analysis time, each clause is queried for
              its top-5 nearest neighbors — enabling cross-document semantic contradiction detection without
              brute-forcing all pairs.
            </p>
          </div>
          <div className="bg-white border border-gray-200 rounded-xl p-5 shadow-sm">
            <div className="text-2xl mb-2">🧪</div>
            <h4 className="font-semibold text-gray-900 mb-2">Synthetic Data</h4>
            <p className="text-sm text-gray-600 leading-relaxed">
              35 clean synthetic clauses (5 per category) and 21 adversarial clauses (3 per category)
              are generated via GPT-4o at temperature 0.7. A cosine-similarity diversity filter (threshold 0.85)
              prevents near-duplicate generation. Human review gate: <code>human_accepted</code> defaults
              to False until manually approved.
            </p>
          </div>
        </div>
      </section>

      {/* Risk taxonomy table */}
      <section>
        <h3 className="text-lg font-bold text-gray-900 mb-4">Risk Taxonomy</h3>
        <div className="bg-white border border-gray-200 rounded-xl overflow-hidden shadow-sm">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="text-left px-4 py-3 font-semibold text-gray-700 w-40">Category</th>
                <th className="text-left px-4 py-3 font-semibold text-gray-700">Description</th>
              </tr>
            </thead>
            <tbody>
              {TAXONOMY.map(({ label, color, desc }, i) => (
                <tr key={label} className={i % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                  <td className="px-4 py-3">
                    <span className={`inline-block px-2 py-0.5 rounded text-xs font-semibold ${color}`}>
                      {label}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-gray-600">{desc}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      {/* Ethical considerations */}
      <section>
        <h3 className="text-lg font-bold text-gray-900 mb-4">Ethical Considerations</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {[
            {
              icon: '⚖️',
              title: 'Not a Legal Tool',
              body: 'AIRA flags potential issues for human review — it does not determine whether a clause is legally valid or enforceable. Every output should be reviewed by a policy expert before any institutional action is taken.',
            },
            {
              icon: '🎯',
              title: 'Classifier Bias',
              body: 'GPT-4o may reflect biases in its training data toward certain interpretations of academic fairness. The prompt was calibrated on NEU/Harvard/MIT policies — performance on smaller institutions with different policy styles is untested.',
            },
            {
              icon: '📋',
              title: 'Copyright & Privacy',
              body: 'Uploaded PDFs are sent to OpenAI\'s API for classification. Users should not upload documents containing personal student data (FERPA-protected) or proprietary institutional content without authorization.',
            },
            {
              icon: '🔍',
              title: 'Transparency by Design',
              body: 'Every flagged clause includes a verbatim cited_text and reasoning chain. Faithfulness scoring ensures the model cannot silently hallucinate evidence. Confidence scores and low-confidence flags are always surfaced.',
            },
          ].map(({ icon, title, body }) => (
            <div key={title} className="bg-white border border-gray-200 rounded-xl p-5 shadow-sm flex gap-4">
              <span className="text-2xl flex-shrink-0">{icon}</span>
              <div>
                <h4 className="font-semibold text-gray-900 mb-1">{title}</h4>
                <p className="text-sm text-gray-600 leading-relaxed">{body}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Limitations & future work */}
      <section className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <h3 className="text-lg font-bold text-gray-900 mb-3">Known Limitations</h3>
          <ul className="space-y-2 text-sm text-gray-600">
            {[
              'Sentence segmentation can split or merge clauses incorrectly in heavily formatted PDFs (tables, bullets).',
              'Very short clauses (&lt; 15 words) are harder to classify reliably — confidence tends to be lower.',
              'Contradiction detection only considers pairs with cosine similarity &gt; 0.4; low-overlap contradictions are missed.',
              'Upload is capped at 200 clauses per document to limit OpenAI API cost.',
              'No cross-document clause comparison in the Upload flow — only pre-indexed documents support semantic search.',
              'Free-tier Render deployment sleeps after 15 minutes of inactivity — first request after sleep takes ~30s.',
            ].map((item, i) => (
              <li key={i} className="flex gap-2">
                <span className="text-red-400 flex-shrink-0 mt-0.5">✕</span>
                <span dangerouslySetInnerHTML={{ __html: item }} />
              </li>
            ))}
          </ul>
        </div>
        <div>
          <h3 className="text-lg font-bold text-gray-900 mb-3">Future Work</h3>
          <ul className="space-y-2 text-sm text-gray-600">
            {[
              'Fine-tune a smaller open-source model on the synthetic + human-annotated dataset to reduce API cost.',
              'Add cross-document contradiction detection in the Upload flow using the pre-built vector index.',
              'Interactive clause editor: let policy authors fix flagged issues in-browser and re-analyze.',
              'Export to PDF/DOCX with inline annotations for institutional reporting.',
              'Multi-language support for policies written in Spanish, French, or Mandarin.',
              'Version comparison: track how a policy\'s risk profile changes between annual revisions.',
            ].map((item, i) => (
              <li key={i} className="flex gap-2">
                <span className="text-green-500 flex-shrink-0 mt-0.5">→</span>
                <span>{item}</span>
              </li>
            ))}
          </ul>
        </div>
      </section>

      {/* Footer credit */}
      <div className="text-center text-xs text-gray-400 pt-4 border-t border-gray-100">
        Built for INFO 7375 Generative AI Engineering · Northeastern University · Spring 2026 ·{' '}
        <a
          href="https://github.com/rajesh1997r/academic-integrity-risk-analyzer"
          className="text-indigo-400 hover:underline"
          target="_blank"
          rel="noopener noreferrer"
        >
          GitHub
        </a>
      </div>
    </div>
  )
}

export default function App() {
  const [activeTab, setActiveTab] = useState('Demo')

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white border-b border-gray-200 shadow-sm">
        <div className="max-w-6xl mx-auto px-4 py-4 flex items-center justify-between">
          <div>
            <h1 className="text-xl font-bold text-gray-900">AIRA</h1>
            <p className="text-xs text-gray-500">Academic Integrity Risk Analyzer</p>
          </div>
          <nav className="flex gap-1">
            {TABS.map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                  activeTab === tab
                    ? 'bg-indigo-600 text-white'
                    : 'text-gray-600 hover:bg-gray-100'
                }`}
              >
                {tab}
              </button>
            ))}
          </nav>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-4 py-6">
        {activeTab === 'Demo' && <DemoView />}
        {activeTab === 'Upload' && <UploadView />}
        {activeTab === 'Evaluation' && <EvaluationDashboard />}
        {activeTab === 'About' && <AboutTab />}
      </main>
    </div>
  )
}
