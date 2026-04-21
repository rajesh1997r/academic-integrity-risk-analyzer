import { useEffect, useState } from 'react'
import axios from 'axios'

const API = import.meta.env.VITE_API_URL || 'http://localhost:8000'

const CATEGORIES = [
  'Ambiguity', 'UndefinedTerm', 'EnforcementGap', 'ScopeConflict',
  'AuthorityConflict', 'AIUsageLoophole', 'CircularDefinition', 'None',
]

export default function EvaluationDashboard() {
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    axios.get(`${API}/evaluation`)
      .then((res) => setData(res.data))
      .catch(() => setError('No evaluation results available. Run backend/evaluator.py first.'))
      .finally(() => setLoading(false))
  }, [])

  if (loading) return <p className="text-gray-500 text-sm py-8 text-center">Loading evaluation data…</p>
  if (error) return (
    <div className="max-w-xl mx-auto py-12 text-center space-y-4">
      <div className="text-4xl">📊</div>
      <h3 className="text-lg font-semibold text-gray-800">No evaluation results yet</h3>
      <p className="text-sm text-gray-500">To populate this tab, complete these three steps:</p>
      <ol className="text-sm text-left bg-white border border-gray-200 rounded-xl p-5 space-y-3 shadow-sm">
        <li className="flex gap-3"><span className="font-bold text-indigo-600 w-5 flex-shrink-0">1.</span><span>Open <code className="bg-gray-100 px-1 rounded">data/ground_truth_template.json</code>, replace each <code className="bg-gray-100 px-1 rounded">__YOUR_LABEL_HERE__</code> with the correct risk category, and save as <code className="bg-gray-100 px-1 rounded">data/ground_truth.json</code>.</span></li>
        <li className="flex gap-3"><span className="font-bold text-indigo-600 w-5 flex-shrink-0">2.</span><span>Run <code className="bg-gray-100 px-1 rounded">python -m backend.evaluator</code> from the project root. This classifies each annotated clause and writes a results file.</span></li>
        <li className="flex gap-3"><span className="font-bold text-indigo-600 w-5 flex-shrink-0">3.</span><span>Refresh this page. The confusion matrix, accuracy, and faithfulness scores will appear.</span></li>
      </ol>
    </div>
  )

  const { accuracy, faithfulness_score, hallucination_rate, precision_per_category, recall_per_category, confusion_matrix, sample, sample_note } = data

  return (
    <div className="space-y-6">
      {sample && (
        <div className="bg-amber-50 border border-amber-200 rounded-lg px-4 py-3 text-sm text-amber-800 flex gap-2">
          <span>⚠️</span>
          <span><strong>Sample data</strong> — {sample_note}</span>
        </div>
      )}
      <div className="grid grid-cols-3 gap-4">
        <MetricCard label="Accuracy" value={`${(accuracy * 100).toFixed(1)}%`} />
        <MetricCard label="Faithfulness" value={`${(faithfulness_score * 100).toFixed(1)}%`} />
        <MetricCard label="Hallucination Rate" value={`${(hallucination_rate * 100).toFixed(1)}%`} />
      </div>

      <div className="bg-white rounded-lg border border-gray-200 p-4">
        <h3 className="text-sm font-semibold text-gray-700 mb-3">Precision / Recall per Category</h3>
        <table className="w-full text-sm">
          <thead className="text-xs text-gray-500 uppercase">
            <tr>
              <th className="text-left py-1 pr-4">Category</th>
              <th className="text-right py-1 pr-4">Precision</th>
              <th className="text-right py-1">Recall</th>
            </tr>
          </thead>
          <tbody>
            {CATEGORIES.map((cat) => (
              <tr key={cat} className="border-t border-gray-50">
                <td className="py-1 pr-4 text-gray-700">{cat}</td>
                <td className="py-1 pr-4 text-right text-gray-600">
                  {((precision_per_category?.[cat] ?? 0) * 100).toFixed(1)}%
                </td>
                <td className="py-1 text-right text-gray-600">
                  {((recall_per_category?.[cat] ?? 0) * 100).toFixed(1)}%
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {confusion_matrix && (
        <div className="bg-white rounded-lg border border-gray-200 p-4 overflow-x-auto">
          <h3 className="text-sm font-semibold text-gray-700 mb-3">Confusion Matrix (rows = true, cols = predicted)</h3>
          <table className="text-xs border-collapse">
            <thead>
              <tr>
                <th className="border border-gray-200 px-2 py-1 bg-gray-50" />
                {CATEGORIES.map((c) => (
                  <th key={c} className="border border-gray-200 px-2 py-1 bg-gray-50 whitespace-nowrap">{c}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {CATEGORIES.map((row) => (
                <tr key={row}>
                  <td className="border border-gray-200 px-2 py-1 font-medium bg-gray-50 whitespace-nowrap">{row}</td>
                  {CATEGORIES.map((col) => {
                    const val = confusion_matrix?.[row]?.[col] ?? 0
                    const isdiag = row === col
                    return (
                      <td
                        key={col}
                        className={`border border-gray-200 px-2 py-1 text-center ${isdiag && val > 0 ? 'bg-green-50 font-semibold' : val > 0 ? 'bg-red-50' : ''}`}
                      >
                        {val > 0 ? val : ''}
                      </td>
                    )
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}

function MetricCard({ label, value }) {
  return (
    <div className="bg-white rounded-lg border border-gray-200 p-4">
      <p className="text-xs text-gray-500 uppercase tracking-wide mb-1">{label}</p>
      <p className="text-2xl font-bold text-gray-900">{value}</p>
    </div>
  )
}
