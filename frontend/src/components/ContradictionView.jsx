const TYPE_BADGE = {
  PermissionConflict: 'bg-red-100    text-red-700    border-red-200',
  PunishmentConflict: 'bg-orange-100 text-orange-700 border-orange-200',
  ScopeOverlap:       'bg-amber-100  text-amber-700  border-amber-200',
  PolicyGap:          'bg-purple-100 text-purple-700 border-purple-200',
}

function ClauseCard({ clause, side }) {
  const styles = side === 'a'
    ? { bar: 'bg-indigo-400', bg: 'bg-indigo-50/50', label: 'text-indigo-500' }
    : { bar: 'bg-violet-400',  bg: 'bg-violet-50/50',  label: 'text-violet-500' }

  return (
    <div className={`rounded-xl border border-slate-200 p-4 ${styles.bg}`}>
      <p className={`text-[10px] font-bold tracking-widest uppercase mb-2 ${styles.label}`}>
        {clause.source_doc.replace(/\.pdf\.pdf$/i, '.pdf')} · p.{clause.page_num}
      </p>
      <p className="text-sm text-slate-700 leading-relaxed">{clause.text}</p>
    </div>
  )
}

function ContradictionCard({ contradiction }) {
  const { clause_a, clause_b, contradiction_type, explanation } = contradiction
  const badge = TYPE_BADGE[contradiction_type] ?? 'bg-slate-100 text-slate-600 border-slate-200'

  return (
    <div className="bg-white rounded-xl border border-slate-200 p-5 mb-4 shadow-sm hover:shadow-md transition-shadow duration-200">
      <div className="flex items-start gap-3 mb-4">
        <span className={`shrink-0 text-xs font-semibold px-2.5 py-1 rounded-full border ${badge}`}>
          {contradiction_type}
        </span>
        <p className="text-xs text-slate-500 leading-relaxed">{explanation}</p>
      </div>

      <div className="grid grid-cols-[1fr_32px_1fr] items-start gap-3">
        <ClauseCard clause={clause_a} side="a" />
        <div className="flex items-center justify-center pt-6">
          <div className="w-8 h-8 rounded-full bg-slate-100 border border-slate-200 flex items-center justify-center">
            <span className="text-[10px] font-bold text-slate-400 tracking-tight">vs</span>
          </div>
        </div>
        <ClauseCard clause={clause_b} side="b" />
      </div>
    </div>
  )
}

export default function ContradictionView({ contradictions }) {
  if (!contradictions || contradictions.length === 0) {
    return (
      <div className="bg-white rounded-xl border border-slate-200 p-10 text-center text-slate-400 text-sm mb-8">
        No contradictions detected.
      </div>
    )
  }

  return (
    <div className="mb-8">
      <div className="flex items-center gap-2 mb-4">
        <h3 className="text-sm font-semibold text-slate-700">
          Contradictions
          <span className="ml-2 text-slate-400 font-normal">({contradictions.length})</span>
        </h3>
      </div>
      {contradictions.map((c, i) => (
        <ContradictionCard key={i} contradiction={c} />
      ))}
    </div>
  )
}
