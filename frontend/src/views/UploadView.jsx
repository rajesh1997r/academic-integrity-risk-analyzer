import { useRef, useState } from 'react'
import axios from 'axios'
import Scorecard from '../components/Scorecard'
import ClauseTable from '../components/ClauseTable'
import ContradictionView from '../components/ContradictionView'
import RiskHeatmap from '../components/RiskHeatmap'

const API = import.meta.env.VITE_API_URL || 'http://localhost:8000'
const MAX_BYTES = 10 * 1024 * 1024

const SAMPLES = [
  { name: 'Stanford', file: 'stanford_integrity.pdf', clauses: 34, note: 'AI threshold undefined' },
  { name: 'UChicago', file: 'uchicago_integrity.pdf', clauses: 38, note: 'Definition updates w/o notice' },
  { name: 'CMU', file: 'cmu_integrity.pdf', clauses: 41, note: 'AI vs. computational tool gap' },
  { name: 'Columbia', file: 'columbia_integrity.pdf', clauses: 44, note: 'Voice assistant loophole' },
]

export default function UploadView() {
  const [report, setReport] = useState(null)
  const [loading, setLoading] = useState(false)
  const [loadingSample, setLoadingSample] = useState(null)
  const [error, setError] = useState(null)
  const [dragging, setDragging] = useState(false)
  const inputRef = useRef(null)

  const handleFile = async (file) => {
    if (!file) return
    if (!file.name.toLowerCase().endsWith('.pdf')) {
      setError('Only PDF files are accepted.')
      return
    }
    if (file.size > MAX_BYTES) {
      setError('File exceeds 10MB limit.')
      return
    }

    setError(null)
    setReport(null)
    setLoading(true)

    const form = new FormData()
    form.append('file', file)

    try {
      const res = await axios.post(`${API}/analyze`, form, {
        headers: { 'Content-Type': 'multipart/form-data' },
      })
      setReport(res.data)
    } catch (err) {
      const msg = err.response?.data?.detail ?? 'Analysis failed. Please try again.'
      setError(msg)
    } finally {
      setLoading(false)
    }
  }

  const onDrop = (e) => {
    e.preventDefault()
    setDragging(false)
    handleFile(e.dataTransfer.files?.[0])
  }

  const runSample = async (sample) => {
    setLoadingSample(sample.name)
    setError(null)
    try {
      const res = await fetch(`/samples/${sample.file}`)
      const blob = await res.blob()
      const file = new File([blob], sample.file, { type: 'application/pdf' })
      await handleFile(file)
    } catch {
      setError(`Failed to load sample: ${sample.name}`)
    } finally {
      setLoadingSample(null)
    }
  }

  return (
    <div>
      {/* Sample policies */}
      <div className="mb-6">
        <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">
          Try a sample policy
        </p>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {SAMPLES.map((s) => (
            <button
              key={s.name}
              onClick={() => runSample(s)}
              disabled={loading || loadingSample !== null}
              className="text-left border border-gray-200 rounded-xl p-3 bg-white hover:border-indigo-300 hover:bg-indigo-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed shadow-sm"
            >
              <div className="flex items-center justify-between mb-1">
                <span className="text-sm font-semibold text-gray-800">{s.name}</span>
                {loadingSample === s.name ? (
                  <svg className="animate-spin h-3.5 w-3.5 text-indigo-500" viewBox="0 0 24 24" fill="none">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
                  </svg>
                ) : (
                  <span className="text-xs text-gray-400">{s.clauses} cl.</span>
                )}
              </div>
              <p className="text-xs text-gray-500 leading-snug">{s.note}</p>
            </button>
          ))}
        </div>
      </div>

      <div
        className={`border-2 border-dashed rounded-xl p-12 text-center mb-6 transition-colors cursor-pointer ${
          dragging ? 'border-indigo-400 bg-indigo-50' : 'border-gray-300 hover:border-indigo-300 hover:bg-gray-50'
        }`}
        onDragOver={(e) => { e.preventDefault(); setDragging(true) }}
        onDragLeave={() => setDragging(false)}
        onDrop={onDrop}
        onClick={() => inputRef.current?.click()}
      >
        <input
          ref={inputRef}
          type="file"
          accept=".pdf"
          className="hidden"
          onChange={(e) => handleFile(e.target.files?.[0])}
        />
        <p className="text-gray-500 text-sm">
          {loading ? 'Analyzing…' : 'Drag & drop a PDF here, or click to select'}
        </p>
        <p className="text-xs text-gray-400 mt-1">PDF only · 10MB max · 200 clause cap</p>
      </div>

      {loading && (
        <div className="flex items-center justify-center py-10 text-indigo-600 text-sm gap-2">
          <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24" fill="none">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
          </svg>
          Running analysis — this may take 30–60 seconds…
        </div>
      )}

      {error && (
        <div className="rounded-lg bg-red-50 border border-red-200 p-4 text-sm text-red-700 mb-6">
          {error}
        </div>
      )}

      {report && (
        <div>
          <div className="rounded-lg bg-green-50 border border-green-200 px-4 py-3 mb-6 text-sm text-green-800">
            Analysis complete for <strong>{report.source_doc.replace(/\.pdf\.pdf$/i, '.pdf')}</strong>
          </div>
          <Scorecard report={report} />
          <RiskHeatmap distribution={report.risk_distribution} />
          <ClauseTable annotations={report.annotations} />
          <ContradictionView contradictions={report.contradictions} />
        </div>
      )}
    </div>
  )
}
