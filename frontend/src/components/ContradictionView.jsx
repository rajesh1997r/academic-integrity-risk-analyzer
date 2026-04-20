const TYPE_COLORS = {
  PermissionConflict: 'bg-red-100 text-red-800',
  PunishmentConflict: 'bg-orange-100 text-orange-800',
  ScopeOverlap: 'bg-yellow-100 text-yellow-800',
  PolicyGap: 'bg-purple-100 text-purple-800',
}

function TypeBadge({ type }) {
  const color = TYPE_COLORS[type] ?? 'bg-gray-100 text-gray-700'
  return (
    <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${color}`}>{type}</span>
  )
}

function ContradictionCard({ contradiction }) {
  const { clause_a, clause_b, contradiction_type, explanation } = contradiction
  return (
    <div className="rounded-lg border border-gray-200 bg-white p-4 mb-4">
      <div className="flex items-center gap-2 mb-3">
        <TypeBadge type={contradiction_type} />
        <span className="text-xs text-gray-500">{explanation}</span>
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div className="bg-gray-50 rounded p-3">
          <p className="text-xs font-semibold text-gray-500 mb-1">
            {clause_a.source_doc.replace(/\.pdf\.pdf$/i, '.pdf')} · p.{clause_a.page_num}
          </p>
          <p className="text-sm text-gray-700">{clause_a.text}</p>
        </div>
        <div className="bg-gray-50 rounded p-3">
          <p className="text-xs font-semibold text-gray-500 mb-1">
            {clause_b.source_doc.replace(/\.pdf\.pdf$/i, '.pdf')} · p.{clause_b.page_num}
          </p>
          <p className="text-sm text-gray-700">{clause_b.text}</p>
        </div>
      </div>
    </div>
  )
}

export default function ContradictionView({ contradictions }) {
  if (!contradictions || contradictions.length === 0) {
    return (
      <div className="bg-white rounded-lg border border-gray-200 p-6 text-center text-gray-500 text-sm mb-6">
        No contradictions detected.
      </div>
    )
  }

  return (
    <div className="mb-6">
      <h3 className="text-sm font-semibold text-gray-700 mb-3">
        Contradictions ({contradictions.length})
      </h3>
      {contradictions.map((c, i) => (
        <ContradictionCard key={i} contradiction={c} />
      ))}
    </div>
  )
}
