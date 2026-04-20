import { useState } from 'react'

const BADGE_COLORS = {
  Ambiguity: 'bg-indigo-100 text-indigo-800',
  UndefinedTerm: 'bg-yellow-100 text-yellow-800',
  EnforcementGap: 'bg-red-100 text-red-800',
  ScopeConflict: 'bg-purple-100 text-purple-800',
  AuthorityConflict: 'bg-pink-100 text-pink-800',
  AIUsageLoophole: 'bg-teal-100 text-teal-800',
  CircularDefinition: 'bg-orange-100 text-orange-800',
  None: 'bg-gray-100 text-gray-600',
}

function RiskBadge({ category }) {
  const color = BADGE_COLORS[category] ?? 'bg-gray-100 text-gray-600'
  return (
    <span className={`inline-block text-xs font-medium px-2 py-0.5 rounded-full ${color}`}>
      {category}
    </span>
  )
}

function AnnotationRow({ annotation }) {
  const [expanded, setExpanded] = useState(false)
  const { clause_text, risk_category, confidence, low_confidence_flag, reasoning, cited_text } = annotation

  return (
    <>
      <tr
        className="border-b border-gray-100 hover:bg-gray-50 cursor-pointer"
        onClick={() => setExpanded((v) => !v)}
      >
        <td className="px-4 py-3 text-sm text-gray-700 max-w-xs">
          <span className="line-clamp-2">{clause_text}</span>
        </td>
        <td className="px-4 py-3 whitespace-nowrap">
          <RiskBadge category={risk_category} />
        </td>
        <td className="px-4 py-3 text-sm text-gray-600 whitespace-nowrap">
          {(confidence * 100).toFixed(0)}%
          {low_confidence_flag && (
            <span className="ml-1 text-yellow-500" title="Low confidence">⚠</span>
          )}
        </td>
        <td className="px-4 py-3 text-gray-400 text-sm">{expanded ? '▲' : '▼'}</td>
      </tr>
      {expanded && (
        <tr className="bg-gray-50 border-b border-gray-100">
          <td colSpan={4} className="px-6 py-4 space-y-3">
            <div>
              <span className="text-xs font-semibold text-gray-500 uppercase">Full Clause</span>
              <p className="text-sm text-gray-700 mt-1">{clause_text}</p>
            </div>
            <div>
              <span className="text-xs font-semibold text-gray-500 uppercase">Cited Text</span>
              <p className="text-sm text-indigo-700 mt-1 italic">"{cited_text}"</p>
            </div>
            <div>
              <span className="text-xs font-semibold text-gray-500 uppercase">Reasoning</span>
              <p className="text-sm text-gray-700 mt-1">{reasoning}</p>
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
      <div className="bg-white rounded-lg border border-gray-200 p-6 text-center text-gray-500 text-sm mb-6">
        No risk findings.
      </div>
    )
  }

  return (
    <div className="bg-white rounded-lg border border-gray-200 mb-6 overflow-hidden">
      <div className="px-4 py-3 border-b border-gray-100">
        <h3 className="text-sm font-semibold text-gray-700">
          Flagged Clauses ({flagged.length}) — click a row to expand
        </h3>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-left">
          <thead className="bg-gray-50 text-xs text-gray-500 uppercase">
            <tr>
              <th className="px-4 py-2">Clause</th>
              <th className="px-4 py-2">Risk</th>
              <th className="px-4 py-2">Confidence</th>
              <th className="px-4 py-2" />
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
