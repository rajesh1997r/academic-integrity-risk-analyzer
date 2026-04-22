import { useEffect, useState } from 'react'
import axios from 'axios'

const API = import.meta.env.VITE_API_URL || 'http://localhost:8000'

const CATEGORIES = [
  'Ambiguity', 'UndefinedTerm', 'EnforcementGap', 'ScopeConflict',
  'AuthorityConflict', 'AIUsageLoophole', 'CircularDefinition', 'None',
]

const STATUS_STYLES = {
  succeeded:        'bg-emerald-100 text-emerald-800',
  running:          'bg-blue-100    text-blue-800',
  validating_files: 'bg-blue-100    text-blue-800',
  queued:           'bg-amber-100   text-amber-800',
  failed:           'bg-red-100     text-red-800',
  cancelled:        'bg-slate-100   text-slate-700',
}

function MetricCard({ label, value, sub, accent = '' }) {
  return (
    <div className={`rounded-xl border p-5 bg-white shadow-sm ${accent || 'border-slate-200'}`}>
      <p className="text-xs font-semibold tracking-wider uppercase text-slate-400 mb-3">{label}</p>
      <p className="text-3xl font-extrabold tracking-tight text-slate-900 leading-none">{value}</p>
      {sub && <p className="text-xs text-slate-400 mt-1.5">{sub}</p>}
    </div>
  )
}

function FineTuneSection() {
  const [job, setJob]         = useState(null)
  const [compare, setCompare] = useState(null)

  useEffect(() => {
    axios.get(`${API}/finetune/status`).then((r) => setJob(r.data)).catch(() => {})
    axios.get(`${API}/finetune/compare`).then((r) => setCompare(r.data)).catch(() => {})
  }, [])

  return (
    <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm">
      <h3 className="text-sm font-semibold text-slate-700 mb-5">
        Fine-Tuning — gpt-4o-mini on AIRA Dataset
      </h3>

      {/* Training stats */}
      <div className="grid grid-cols-3 gap-4 mb-5">
        {[
          { value: '51',     label: 'Ground Truth Clauses', sub: 'human-annotated (NEU)' },
          { value: '35',     label: 'Synthetic Clean',       sub: 'GPT-4o generated, 7 categories' },
          { value: '69 / 17', label: 'Train / Val Split',   sub: '80 / 20 split' },
        ].map(({ value, label, sub }) => (
          <div key={label} className="bg-slate-50 rounded-xl border border-slate-100 p-4">
            <p className="text-xl font-bold text-slate-900">{value}</p>
            <p className="text-xs font-medium text-slate-700 mt-1">{label}</p>
            <p className="text-[11px] text-slate-400 mt-0.5">{sub}</p>
          </div>
        ))}
      </div>

      {/* Job status */}
      {job ? (
        <div className="flex flex-wrap items-center gap-3 mb-4">
          <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${STATUS_STYLES[job.status] ?? 'bg-slate-100 text-slate-700'}`}>
            {job.status}
          </span>
          <span className="text-xs text-slate-500">
            Job: <code className="text-slate-700 font-mono">{job.job_id}</code>
          </span>
          {job.fine_tuned_model && (
            <span className="text-xs text-slate-500">
              Model: <code className="text-slate-700 font-mono break-all">{job.fine_tuned_model}</code>
            </span>
          )}
          {job.trained_tokens && (
            <span className="text-xs text-slate-500">
              {job.trained_tokens.toLocaleString()} tokens trained
            </span>
          )}
        </div>
      ) : (
        <div className="bg-slate-50 rounded-xl border border-slate-100 p-4 space-y-1.5 mb-4">
          <p className="text-xs font-semibold text-slate-700">Job not submitted yet</p>
          {[
            'python -m backend.finetune --prepare   # build training JSONL (free)',
            'python -m backend.finetune --submit    # upload + start job (~$0.50)',
            'python -m backend.finetune --status    # poll until succeeded',
            'python -m backend.finetune --compare   # run accuracy comparison',
          ].map((cmd) => (
            <p key={cmd} className="text-[11px] text-slate-500 font-mono">{cmd}</p>
          ))}
        </div>
      )}

      {/* Comparison */}
      {compare && (
        <div>
          <p className="text-xs font-semibold tracking-wider uppercase text-slate-400 mb-3">
            Model Comparison ({compare.total_clauses} clauses)
          </p>
          <div className="grid grid-cols-2 gap-4 mb-3">
            <div className="bg-indigo-50 rounded-xl border border-indigo-100 p-4">
              <p className="text-xs font-medium text-indigo-500 mb-2">GPT-4o Base</p>
              <p className="text-2xl font-bold text-indigo-900">
                {(compare.base_model.accuracy * 100).toFixed(1)}%
              </p>
              <p className="text-xs text-indigo-400 mt-1">
                {compare.base_model.correct}/{compare.base_model.total} correct
              </p>
            </div>
            <div className="bg-violet-50 rounded-xl border border-violet-100 p-4">
              <p className="text-xs font-medium text-violet-500 mb-2">Fine-tuned gpt-4o-mini</p>
              <p className="text-2xl font-bold text-violet-900">
                {(compare.finetuned_model.accuracy * 100).toFixed(1)}%
              </p>
              <p className="text-xs text-violet-400 mt-1">
                {compare.finetuned_model.correct}/{compare.finetuned_model.total} correct
              </p>
            </div>
          </div>
          <p className="text-xs text-slate-400">
            Delta:{' '}
            <span className={`font-semibold ${compare.accuracy_delta >= 0 ? 'text-emerald-600' : 'text-red-500'}`}>
              {compare.accuracy_delta >= 0 ? '+' : ''}{(compare.accuracy_delta * 100).toFixed(1)}%
            </span>
            {' '}— {compare.note}
          </p>
        </div>
      )}
    </div>
  )
}

export default function EvaluationDashboard() {
  const [data, setData]       = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError]     = useState(null)

  useEffect(() => {
    axios
      .get(`${API}/evaluation`)
      .then((res) => setData(res.data))
      .catch(() => setError('No evaluation results available.'))
      .finally(() => setLoading(false))
  }, [])

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="w-8 h-8 rounded-full border-2 border-slate-200 border-t-indigo-600 animate-spin" />
      </div>
    )
  }

  if (error) {
    return (
      <div className="max-w-xl py-12 space-y-5">
        <div>
          <h3 className="text-lg font-bold text-slate-800 mb-1">No evaluation results yet</h3>
          <p className="text-sm text-slate-500">Complete these steps to populate this tab:</p>
        </div>
        <ol className="space-y-3">
          {[
            <>Open <code className="bg-slate-100 px-1.5 py-0.5 rounded text-xs">data/ground_truth_template.json</code>, replace each <code className="bg-slate-100 px-1.5 py-0.5 rounded text-xs">__YOUR_LABEL_HERE__</code> with the correct category, and save as <code className="bg-slate-100 px-1.5 py-0.5 rounded text-xs">data/ground_truth.json</code>.</>,
            <>Run <code className="bg-slate-100 px-1.5 py-0.5 rounded text-xs">python -m backend.evaluator</code> from the project root.</>,
            <>Refresh this page. Metrics will appear automatically.</>,
          ].map((step, i) => (
            <li key={i} className="flex gap-3 text-sm text-slate-600">
              <span className="font-bold text-indigo-600 shrink-0 w-5">{i + 1}.</span>
              <span className="leading-relaxed">{step}</span>
            </li>
          ))}
        </ol>
        <FineTuneSection />
      </div>
    )
  }

  const {
    accuracy, faithfulness_score, hallucination_rate,
    precision_per_category, recall_per_category, confusion_matrix, sample, sample_note,
  } = data

  return (
    <div className="space-y-6">
      {sample && (
        <div className="rounded-xl bg-amber-50 border border-amber-200 px-5 py-3.5 text-sm text-amber-800 flex items-start gap-2">
          <svg className="w-4 h-4 shrink-0 mt-0.5 text-amber-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z" />
          </svg>
          <span><strong>Sample data</strong> — {sample_note}</span>
        </div>
      )}

      <div className="grid grid-cols-3 gap-4">
        <MetricCard
          label="Accuracy"
          value={`${(accuracy * 100).toFixed(1)}%`}
          sub="on annotated clauses"
        />
        <MetricCard
          label="Faithfulness"
          value={`${(faithfulness_score * 100).toFixed(1)}%`}
          sub="citation accuracy"
          accent="border-indigo-200"
        />
        <MetricCard
          label="Hallucination Rate"
          value={`${(hallucination_rate * 100).toFixed(1)}%`}
          sub="false citations"
          accent={hallucination_rate > 0.1 ? 'border-red-200' : 'border-emerald-200'}
        />
      </div>

      {/* Precision / Recall table */}
      <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm overflow-hidden">
        <h3 className="text-sm font-semibold text-slate-700 mb-4">Precision / Recall per Category</h3>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-100">
                <th className="text-left py-2 pr-6 text-xs font-semibold tracking-wider uppercase text-slate-400">Category</th>
                <th className="text-right py-2 pr-6 text-xs font-semibold tracking-wider uppercase text-slate-400">Precision</th>
                <th className="text-right py-2 text-xs font-semibold tracking-wider uppercase text-slate-400">Recall</th>
              </tr>
            </thead>
            <tbody>
              {CATEGORIES.map((cat) => {
                const prec = (precision_per_category?.[cat] ?? 0) * 100
                const rec  = (recall_per_category?.[cat]  ?? 0) * 100
                return (
                  <tr key={cat} className="border-t border-slate-50 hover:bg-slate-50 transition-colors">
                    <td className="py-2.5 pr-6 text-slate-700 font-medium">{cat}</td>
                    <td className="py-2.5 pr-6 text-right text-slate-500 tabular-nums">{prec.toFixed(1)}%</td>
                    <td className="py-2.5 text-right text-slate-500 tabular-nums">{rec.toFixed(1)}%</td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Confusion matrix */}
      {confusion_matrix && (
        <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm overflow-x-auto">
          <h3 className="text-sm font-semibold text-slate-700 mb-4">
            Confusion Matrix
            <span className="ml-2 text-slate-400 font-normal text-xs">rows = true label · cols = predicted</span>
          </h3>
          <table className="text-xs border-collapse">
            <thead>
              <tr>
                <th className="border border-slate-100 px-2.5 py-2 bg-slate-50 text-slate-400" />
                {CATEGORIES.map((c) => (
                  <th key={c} className="border border-slate-100 px-2.5 py-2 bg-slate-50 text-slate-600 font-semibold whitespace-nowrap">
                    {c}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {CATEGORIES.map((row) => (
                <tr key={row}>
                  <td className="border border-slate-100 px-2.5 py-2 font-semibold bg-slate-50 text-slate-600 whitespace-nowrap">
                    {row}
                  </td>
                  {CATEGORIES.map((col) => {
                    const val    = confusion_matrix?.[row]?.[col] ?? 0
                    const isDiag = row === col
                    return (
                      <td
                        key={col}
                        className={`border border-slate-100 px-2.5 py-2 text-center tabular-nums ${
                          isDiag && val > 0
                            ? 'bg-emerald-50 text-emerald-700 font-semibold'
                            : val > 0
                            ? 'bg-red-50 text-red-600'
                            : 'text-slate-300'
                        }`}
                      >
                        {val > 0 ? val : '·'}
                      </td>
                    )
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <FineTuneSection />
    </div>
  )
}
