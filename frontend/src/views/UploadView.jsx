import { useRef, useState } from 'react'
import axios from 'axios'
import Scorecard from '../components/Scorecard'
import ClauseTable from '../components/ClauseTable'
import ContradictionView from '../components/ContradictionView'
import RiskHeatmap from '../components/RiskHeatmap'

const API = import.meta.env.VITE_API_URL || 'http://localhost:8000'
const MAX_BYTES = 10 * 1024 * 1024

export default function UploadView() {
  const [report, setReport] = useState(null)
  const [loading, setLoading] = useState(false)
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

  return (
    <div>
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
