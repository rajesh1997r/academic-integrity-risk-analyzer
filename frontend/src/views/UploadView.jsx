import { useRef, useState } from 'react'
import axios from 'axios'
import Scorecard from '../components/Scorecard'
import ClauseTable from '../components/ClauseTable'
import ContradictionView from '../components/ContradictionView'
import RiskHeatmap from '../components/RiskHeatmap'

const API = import.meta.env.VITE_API_URL || 'http://localhost:8000'
const MAX_BYTES = 10 * 1024 * 1024

const SAMPLES = [
  { name: 'Stanford',  file: 'stanford_integrity.pdf',  clauses: 34, note: 'AI threshold undefined' },
  { name: 'UChicago',  file: 'uchicago_integrity.pdf',  clauses: 38, note: 'Definition updates w/o notice' },
  { name: 'CMU',       file: 'cmu_integrity.pdf',       clauses: 41, note: 'AI vs. computational tool gap' },
  { name: 'Columbia',  file: 'columbia_integrity.pdf',  clauses: 44, note: 'Voice assistant loophole' },
]

function UploadIcon({ className }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
      <path strokeLinecap="round" strokeLinejoin="round"
        d="M3 16.5v2.25A2.25 2.25 0 0 0 5.25 21h13.5A2.25 2.25 0 0 0 21 18.75V16.5m-13.5-9L12 3m0 0 4.5 4.5M12 3v13.5" />
    </svg>
  )
}

function CheckIcon({ className }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="m4.5 12.75 6 6 9-13.5" />
    </svg>
  )
}

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
      setError('File exceeds the 10 MB limit.')
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
      {/* ── Page header ── */}
      <div className="bg-white border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-6 md:px-10 py-12">
          <p className="text-xs font-semibold tracking-widest uppercase text-indigo-600 mb-3">Policy Analyzer</p>
          <h1 className="text-3xl font-extrabold tracking-tight text-slate-900 mb-3">
            Analyze Your Policy
          </h1>
          <p className="text-base text-slate-500 max-w-xl leading-relaxed">
            Upload any university academic integrity PDF to receive a full risk audit powered by GPT-4o.
            Results include risk category, cited text, reasoning, and faithfulness score per clause.
          </p>
          <div className="mt-5 flex flex-wrap gap-4 text-sm text-slate-500">
            {[
              'PDF files only',
              '10 MB maximum',
              '200 clause cap',
              '30–60 second analysis',
            ].map((f) => (
              <span key={f} className="inline-flex items-center gap-1.5">
                <CheckIcon className="w-3.5 h-3.5 text-indigo-500" />
                {f}
              </span>
            ))}
          </div>
        </div>
      </div>

      {/* ── Main content ── */}
      <div className="max-w-7xl mx-auto px-6 md:px-10 py-10">

        {/* Sample policies */}
        <div className="mb-8">
          <p className="text-xs font-semibold tracking-widest uppercase text-slate-400 mb-4">
            Sample Policies
          </p>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            {SAMPLES.map((s) => (
              <button
                key={s.name}
                onClick={() => runSample(s)}
                disabled={loading || loadingSample !== null}
                className="text-left bg-white border border-slate-200 rounded-xl p-4 hover:border-indigo-300 hover:shadow-md transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed group"
              >
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-bold text-slate-800 group-hover:text-indigo-700 transition-colors">
                    {s.name}
                  </span>
                  {loadingSample === s.name ? (
                    <div className="w-4 h-4 rounded-full border-2 border-slate-200 border-t-indigo-500 animate-spin" />
                  ) : (
                    <span className="text-[10px] text-slate-400 bg-slate-100 px-1.5 py-0.5 rounded-full">
                      {s.clauses} cl.
                    </span>
                  )}
                </div>
                <p className="text-xs text-slate-400 leading-snug">{s.note}</p>
              </button>
            ))}
          </div>
        </div>

        {/* Upload zone */}
        <div
          className={`border-2 border-dashed rounded-2xl p-12 text-center mb-8 cursor-pointer transition-all duration-200 ${
            dragging
              ? 'border-indigo-400 bg-indigo-50 scale-[1.005]'
              : 'border-slate-200 bg-white hover:border-indigo-300 hover:bg-slate-50'
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
          <div className={`mx-auto mb-4 w-14 h-14 rounded-2xl flex items-center justify-center transition-colors ${
            dragging ? 'bg-indigo-100 text-indigo-600' : 'bg-slate-100 text-slate-400'
          }`}>
            <UploadIcon className="w-7 h-7" />
          </div>
          <p className={`text-sm font-semibold transition-colors ${dragging ? 'text-indigo-600' : 'text-slate-600'}`}>
            {dragging ? 'Drop your PDF here' : 'Drag and drop a PDF, or click to browse'}
          </p>
          <p className="text-xs text-slate-400 mt-1">PDF only · 10 MB max · 200 clause cap</p>
        </div>

        {/* Loading state */}
        {loading && (
          <div className="bg-white rounded-2xl border border-slate-200 p-10 mb-8 flex flex-col items-center gap-5">
            <div className="w-12 h-12 rounded-full border-2 border-slate-100 border-t-indigo-600 animate-spin" />
            <div className="text-center">
              <p className="text-sm font-semibold text-slate-700">Running analysis…</p>
              <p className="text-xs text-slate-400 mt-1">
                Extracting clauses · Classifying with GPT-4o · Computing faithfulness
              </p>
              <p className="text-xs text-slate-400 mt-0.5">This typically takes 30–60 seconds</p>
            </div>
          </div>
        )}

        {/* Error */}
        {error && (
          <div className="rounded-xl bg-red-50 border border-red-200 px-5 py-4 text-sm text-red-700 mb-8">
            {error}
          </div>
        )}

        {/* Results */}
        {report && (
          <div className="animate-fade-in">
            <div className="rounded-xl bg-emerald-50 border border-emerald-200 px-5 py-3.5 mb-6 text-sm text-emerald-800 flex items-center gap-2">
              <CheckIcon className="w-4 h-4 text-emerald-600 shrink-0" />
              Analysis complete for{' '}
              <strong>{report.source_doc.replace(/\.pdf\.pdf$/i, '.pdf')}</strong>
            </div>
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
