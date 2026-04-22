import { useEffect, useState } from 'react'
import axios from 'axios'
import Scorecard from '../components/Scorecard'
import ClauseTable from '../components/ClauseTable'
import ContradictionView from '../components/ContradictionView'
import RiskHeatmap from '../components/RiskHeatmap'

const API = import.meta.env.VITE_API_URL || 'http://localhost:8000'

const DEMOS = [
  {
    key: 'neu',
    label: 'NEU Academic Integrity',
    endpoint: '/demo',
    institution: 'Northeastern University',
    clauses: 51,
    detail: 'Contains AI-specific language. Best document for demonstrating all 7 risk categories.',
  },
  {
    key: 'harvard',
    label: 'Harvard AI Guidelines',
    endpoint: '/demo/harvard',
    institution: 'Harvard HUIT',
    clauses: 26,
    detail: 'IT-focused generative AI guidelines. Strong AI-specific language with clear scope.',
  },
]

function LoadingSpinner() {
  return (
    <div className="flex flex-col items-center justify-center py-24 gap-4">
      <div className="w-10 h-10 rounded-full border-2 border-slate-200 border-t-indigo-600 animate-spin" />
      <p className="text-sm text-slate-400">Loading analysis…</p>
    </div>
  )
}

export default function DemoView() {
  const [activeDemo, setActiveDemo] = useState('neu')
  const [reports, setReports] = useState({})
  const [loading, setLoading] = useState({})
  const [errors, setErrors] = useState({})

  const loadDemo = (demo) => {
    if (reports[demo.key] || loading[demo.key]) return
    setLoading((p) => ({ ...p, [demo.key]: true }))
    axios
      .get(`${API}${demo.endpoint}`)
      .then((res) => setReports((p) => ({ ...p, [demo.key]: res.data })))
      .catch(() =>
        setErrors((p) => ({
          ...p,
          [demo.key]: 'Demo data unavailable — backend may be waking up. Try again in 30 seconds.',
        }))
      )
      .finally(() => setLoading((p) => ({ ...p, [demo.key]: false })))
  }

  useEffect(() => {
    loadDemo(DEMOS[0])
  }, [])

  const handleTabClick = (demo) => {
    setActiveDemo(demo.key)
    loadDemo(demo)
  }

  const report = reports[activeDemo]
  const isLoading = loading[activeDemo]
  const error = errors[activeDemo]
  const demo = DEMOS.find((d) => d.key === activeDemo)

  return (
    <div>
      {/* ── Hero ── */}
      <section className="bg-slate-950 line-grid relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-indigo-950/50 via-transparent to-transparent pointer-events-none" />
        <div className="relative max-w-7xl mx-auto px-6 md:px-10 py-16 md:py-20">
          <div className="animate-fade-in-up">
            <button
              onClick={() => history.back()}
              className="inline-flex items-center gap-1.5 text-xs text-slate-500 hover:text-slate-300 transition-colors mb-6 group"
            >
              <svg className="w-3.5 h-3.5 group-hover:-translate-x-0.5 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 19.5 3 12m0 0 7.5-7.5M3 12h18" />
              </svg>
              Back
            </button>
            <p className="text-xs font-semibold tracking-widest uppercase text-indigo-400 mb-4">
              Pre-computed Analysis · No API calls on this tab
            </p>
            <h1 className="text-4xl md:text-5xl font-extrabold tracking-tight leading-tight text-white mb-4 max-w-2xl">
              Academic Integrity{' '}
              <span className="bg-gradient-to-r from-indigo-300 to-violet-300 bg-clip-text text-transparent">
                Risk Analysis
              </span>
            </h1>
            <p className="text-base text-slate-400 max-w-xl leading-relaxed">
              Real-world analysis of university policy documents. Every finding is grounded in verbatim
              cited text with faithfulness verification.
            </p>
          </div>

          {/* Stats */}
          <div className="mt-10 flex flex-wrap gap-8 animate-fade-in-up delay-200">
            {[
              { n: '2',   l: 'Policies Shown' },
              { n: '77',  l: 'Clauses Analyzed' },
              { n: '0',   l: 'API Calls Required' },
            ].map(({ n, l }) => (
              <div key={l} className="flex items-baseline gap-2">
                <span className="text-2xl font-bold text-white">{n}</span>
                <span className="text-sm text-slate-400">{l}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Content ── */}
      <div className="max-w-7xl mx-auto px-6 md:px-10 py-8">
        {/* Demo selector */}
        <div className="mb-8">
          <div className="flex flex-wrap items-start gap-3 mb-4">
            {DEMOS.map((d) => (
              <button
                key={d.key}
                onClick={() => handleTabClick(d)}
                className={`relative text-left px-5 py-4 rounded-xl border-2 transition-all duration-200 overflow-hidden min-w-[200px] ${
                  activeDemo === d.key
                    ? 'bg-white border-indigo-400 shadow-lg shadow-indigo-100/60'
                    : 'bg-white border-slate-200 hover:border-indigo-200 hover:shadow-md hover:shadow-slate-100'
                }`}
              >
                {/* Top accent bar on active */}
                <span
                  className={`absolute top-0 left-0 right-0 h-1 rounded-t-xl transition-all duration-200 ${
                    activeDemo === d.key ? 'bg-indigo-600' : 'bg-transparent'
                  }`}
                />
                <p className={`text-sm font-bold leading-snug transition-colors ${
                  activeDemo === d.key ? 'text-indigo-700' : 'text-slate-600'
                }`}>
                  {d.label}
                </p>
                <div className="flex items-center gap-2 mt-2">
                  <span className={`text-[11px] font-semibold px-2 py-0.5 rounded-full transition-colors ${
                    activeDemo === d.key
                      ? 'bg-indigo-100 text-indigo-700'
                      : 'bg-slate-100 text-slate-500'
                  }`}>
                    {d.clauses} clauses
                  </span>
                  <span className="text-[11px] text-slate-400">{d.institution}</span>
                </div>
              </button>
            ))}

            <span className="ml-auto self-center text-xs font-medium text-emerald-700 bg-emerald-50 border border-emerald-200 px-2.5 py-1.5 rounded-full">
              Pre-computed · no API calls
            </span>
          </div>

          {demo && (
            <p className="text-sm text-slate-500 leading-relaxed">
              {demo.detail}
            </p>
          )}
        </div>

        {isLoading && <LoadingSpinner />}

        {error && (
          <div className="rounded-xl bg-red-50 border border-red-200 px-5 py-4 text-sm text-red-700">
            {error}
          </div>
        )}

        {report && (
          <div className="animate-fade-in">
            <Scorecard report={report} />
            <RiskHeatmap distribution={report.risk_distribution} />
            <ClauseTable annotations={report.annotations} />
            <ContradictionView contradictions={report.contradictions} />
          </div>
        )}
      </div>
    </div>
  )
}
