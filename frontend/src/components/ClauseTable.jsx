import { useState } from 'react'

const BADGE = {
  Ambiguity:          'bg-indigo-100 text-indigo-800',
  UndefinedTerm:      'bg-yellow-100 text-yellow-800',
  EnforcementGap:     'bg-red-100    text-red-800',
  ScopeConflict:      'bg-purple-100 text-purple-800',
  AuthorityConflict:  'bg-blue-100   text-blue-800',
  AIUsageLoophole:    'bg-teal-100   text-teal-800',
  CircularDefinition: 'bg-orange-100 text-orange-800',
  None:               'bg-slate-100  text-slate-500',
}

const STRIPE = {
  Ambiguity:          'bg-indigo-400',
  UndefinedTerm:      'bg-yellow-400',
  EnforcementGap:     'bg-red-400',
  ScopeConflict:      'bg-purple-400',
  AuthorityConflict:  'bg-blue-400',
  AIUsageLoophole:    'bg-teal-400',
  CircularDefinition: 'bg-orange-400',
  None:               'bg-slate-300',
}

const CONF_BAR = (pct) =>
  pct >= 75 ? 'bg-emerald-400' : pct >= 55 ? 'bg-amber-400' : 'bg-red-400'

function ChevronIcon({ open }) {
  return (
    <svg
      className={`w-4 h-4 text-slate-400 transition-transform duration-200 ${open ? 'rotate-180' : ''}`}
      fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}
    >
      <path strokeLinecap="round" strokeLinejoin="round" d="m19.5 8.25-7.5 7.5-7.5-7.5" />
    </svg>
  )
}

function AnnotationRow({ annotation }) {
  const [open, setOpen] = useState(false)
  const { clause_text, risk_category, confidence, low_confidence_flag, reasoning, cited_text } = annotation
  const confPct = Math.round(confidence * 100)
  const stripe  = STRIPE[risk_category] ?? 'bg-slate-300'

  return (
    <>
      {/* Trigger row — shares bg with detail row when expanded so they read as one unit */}
      <tr
        className={`cursor-pointer transition-colors ${
          open
            ? 'bg-indigo-50/60'
            : 'border-b border-slate-100 hover:bg-slate-50/80'
        }`}
        onClick={() => setOpen((v) => !v)}
      >
        <td className={`w-1 p-0 ${stripe}`} />
        <td className="px-5 py-3.5 text-sm text-slate-700 max-w-sm">
          <span className="line-clamp-2 leading-snug">{clause_text}</span>
        </td>
        <td className="px-4 py-3.5 whitespace-nowrap">
          <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${BADGE[risk_category] ?? BADGE.None}`}>
            {risk_category}
          </span>
        </td>
        <td className="px-4 py-3.5 whitespace-nowrap">
          <div className="flex items-center gap-2">
            <div className="w-14 h-1.5 bg-slate-100 rounded-full overflow-hidden">
              <div
                className={`h-full rounded-full ${CONF_BAR(confPct)}`}
                style={{ width: `${confPct}%` }}
              />
            </div>
            <span className="text-xs text-slate-400 tabular-nums">{confPct}%</span>
            {low_confidence_flag && (
              <svg className="w-3.5 h-3.5 text-amber-400 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round"
                  d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874
                     1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z" />
              </svg>
            )}
          </div>
        </td>
        <td className="px-4 py-3.5">
          <ChevronIcon open={open} />
        </td>
      </tr>

      {/* Detail row — same tinted bg, card inside, thick bottom border closes the unit */}
      {open && (
        <tr className="bg-indigo-50/60 border-b-2 border-indigo-200/60">
          <td className={`w-1 p-0 ${stripe}`} />
          <td colSpan={4} className="px-5 pt-1 pb-5">
            <div className="rounded-xl border border-slate-200 bg-white shadow-sm overflow-hidden divide-y divide-slate-100">

              {/* Full Clause */}
              <div className="px-5 py-4">
                <p className="text-[10px] font-bold tracking-widest uppercase text-slate-400 mb-2">
                  Full Clause
                </p>
                <p className="text-sm text-slate-700 leading-relaxed">{clause_text}</p>
              </div>

              {/* Cited Text — tinted so it stands out */}
              <div className="px-5 py-4 bg-indigo-50/50">
                <p className="text-[10px] font-bold tracking-widest uppercase text-indigo-500 mb-2">
                  Cited Text
                </p>
                <p className="text-sm text-indigo-700 italic leading-relaxed">"{cited_text}"</p>
              </div>

              {/* Reasoning */}
              <div className="px-5 py-4">
                <p className="text-[10px] font-bold tracking-widest uppercase text-slate-400 mb-2">
                  Reasoning
                </p>
                <p className="text-sm text-slate-600 leading-relaxed">{reasoning}</p>
              </div>

            </div>
          </td>
        </tr>
      )}
    </>
  )
}

export default function ClauseTable({ annotations }) {
  const flagged = annotations.filter((a) => a.risk_category !== 'None')

  if (flagged.length === 0) {
    return (
      <div className="bg-white rounded-xl border border-slate-200 p-10 text-center text-slate-400 text-sm mb-8">
        No risk findings.
      </div>
    )
  }

  return (
    <div className="bg-white rounded-xl border border-slate-200 mb-8 overflow-hidden shadow-sm">
      <div className="px-5 py-4 border-b border-slate-100 flex items-center gap-3">
        <h3 className="text-sm font-semibold text-slate-700">
          Flagged Clauses
          <span className="ml-2 text-slate-400 font-normal">({flagged.length})</span>
        </h3>
        <span className="ml-auto text-xs text-slate-400">Click a row to expand</span>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-left">
          <thead>
            <tr className="bg-slate-50 border-b border-slate-100">
              <th className="w-1 p-0" />
              <th className="px-5 py-3 text-xs font-semibold tracking-wider uppercase text-slate-400">Clause</th>
              <th className="px-4 py-3 text-xs font-semibold tracking-wider uppercase text-slate-400">Risk</th>
              <th className="px-4 py-3 text-xs font-semibold tracking-wider uppercase text-slate-400">Confidence</th>
              <th className="px-4 py-3 w-8" />
            </tr>
          </thead>
          <tbody>
            {flagged.map((a) => (
              <AnnotationRow key={a.clause_id} annotation={a} />
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
