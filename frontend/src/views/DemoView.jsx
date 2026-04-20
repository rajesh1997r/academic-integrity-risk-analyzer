import { useEffect, useState } from 'react'
import axios from 'axios'
import Scorecard from '../components/Scorecard'
import ClauseTable from '../components/ClauseTable'
import ContradictionView from '../components/ContradictionView'
import RiskHeatmap from '../components/RiskHeatmap'

const API = import.meta.env.VITE_API_URL || 'http://localhost:8000'

const DEMOS = [
  { key: 'neu', label: 'NEU Academic Integrity', endpoint: '/demo', description: 'Northeastern University Academic Integrity Policy — 51 clauses, AI language present' },
  { key: 'harvard', label: 'Harvard AI Guidelines', endpoint: '/demo/harvard', description: 'Harvard HUIT Generative AI Guidelines — 26 clauses, strong AI-specific language' },
]

export default function DemoView() {
  const [activeDemo, setActiveDemo] = useState('neu')
  const [reports, setReports] = useState({})
  const [loading, setLoading] = useState({})
  const [errors, setErrors] = useState({})

  const loadDemo = (demo) => {
    if (reports[demo.key] || loading[demo.key]) return
    setLoading(prev => ({ ...prev, [demo.key]: true }))
    axios.get(`${API}${demo.endpoint}`)
      .then(res => setReports(prev => ({ ...prev, [demo.key]: res.data })))
      .catch(() => setErrors(prev => ({ ...prev, [demo.key]: 'Demo data unavailable — backend may be waking up, try again in 30s.' })))
      .finally(() => setLoading(prev => ({ ...prev, [demo.key]: false })))
  }

  useEffect(() => { loadDemo(DEMOS[0]) }, [])

  const handleTabClick = (demo) => {
    setActiveDemo(demo.key)
    loadDemo(demo)
  }

  const report = reports[activeDemo]
  const isLoading = loading[activeDemo]
  const error = errors[activeDemo]
  const demo = DEMOS.find(d => d.key === activeDemo)

  return (
    <div>
      {/* Demo selector */}
      <div className="flex gap-2 mb-4">
        {DEMOS.map(d => (
          <button
            key={d.key}
            onClick={() => handleTabClick(d)}
            className={`px-3 py-1.5 rounded text-sm font-medium border transition-colors ${
              activeDemo === d.key
                ? 'bg-indigo-600 text-white border-indigo-600'
                : 'bg-white text-gray-600 border-gray-300 hover:border-indigo-400'
            }`}
          >
            {d.label}
          </button>
        ))}
      </div>

      <div className="rounded-lg bg-indigo-50 border border-indigo-200 px-4 py-3 mb-6 text-sm text-indigo-800">
        <strong>Demo:</strong> {demo?.description}. Pre-computed — no API calls on this tab.
      </div>

      {isLoading && (
        <div className="flex items-center justify-center py-20 text-gray-400 text-sm">Loading demo analysis…</div>
      )}
      {error && (
        <div className="rounded-lg bg-red-50 border border-red-200 p-6 text-sm text-red-700">{error}</div>
      )}
      {report && (
        <>
          <Scorecard report={report} />
          <RiskHeatmap distribution={report.risk_distribution} />
          <ClauseTable annotations={report.annotations} />
          <ContradictionView contradictions={report.contradictions} />
        </>
      )}
    </div>
  )
}
