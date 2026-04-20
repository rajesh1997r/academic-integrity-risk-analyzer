import { useState } from 'react'
import DemoView from './views/DemoView'
import UploadView from './views/UploadView'
import EvaluationDashboard from './components/EvaluationDashboard'

const TABS = ['Demo', 'Upload', 'Evaluation', 'About']

function AboutTab() {
  return (
    <div className="max-w-3xl mx-auto py-8 space-y-6 text-gray-700">
      <h2 className="text-2xl font-bold text-gray-900">About AIRA</h2>
      <p>
        AIRA (Academic Integrity Risk Analyzer) audits university academic integrity policy PDFs
        for ambiguity, contradictions, enforcement gaps, and AI-related loopholes using GPT-4o
        with a structured risk taxonomy.
      </p>
      <h3 className="text-lg font-semibold text-gray-900">Methodology</h3>
      <ul className="list-disc pl-5 space-y-1 text-sm">
        <li>PDFs are segmented into clauses using sentence-boundary splitting (min 8 words).</li>
        <li>Each clause is classified with exactly one primary risk label using GPT-4o at temperature 0.</li>
        <li>Every finding must include a <em>cited_text</em> — an exact quote from the clause.</li>
        <li>Faithfulness is scored as cosine similarity between cited_text and clause embeddings.</li>
        <li>Contradictions are detected by checking semantically similar clause pairs (sim &gt; 0.4).</li>
      </ul>
      <h3 className="text-lg font-semibold text-gray-900">Risk Taxonomy</h3>
      <ul className="list-disc pl-5 space-y-1 text-sm">
        {[
          ['Ambiguity', 'Language open to multiple interpretations'],
          ['UndefinedTerm', 'Key term used without definition'],
          ['EnforcementGap', 'No mechanism to detect or act on violation'],
          ['ScopeConflict', 'Clause applies inconsistently across contexts'],
          ['AuthorityConflict', 'Unclear who has enforcement authority'],
          ['AIUsageLoophole', 'AI use permitted/prohibited without clear boundary'],
          ['CircularDefinition', 'Definition references itself'],
        ].map(([label, desc]) => (
          <li key={label}><strong>{label}</strong> — {desc}</li>
        ))}
      </ul>
      <h3 className="text-lg font-semibold text-gray-900">Known Limitations</h3>
      <ul className="list-disc pl-5 space-y-1 text-sm">
        <li>Clause segmentation may merge or split sentences incorrectly in heavily formatted PDFs.</li>
        <li>Classification accuracy depends on clause length — very short clauses score lower.</li>
        <li>Contradiction detection is limited to clauses with semantic similarity above 0.4.</li>
        <li>Upload is capped at 200 clauses to prevent cost overrun.</li>
      </ul>
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
