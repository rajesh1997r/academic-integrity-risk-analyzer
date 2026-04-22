const RATING_STYLES = {
  Low:    { card: 'border-emerald-200 bg-emerald-50',  text: 'text-emerald-700',  sub: 'text-emerald-500',  dot: 'bg-emerald-500' },
  Medium: { card: 'border-amber-200   bg-amber-50',    text: 'text-amber-700',    sub: 'text-amber-500',    dot: 'bg-amber-400'  },
  High:   { card: 'border-red-200     bg-red-50',      text: 'text-red-700',      sub: 'text-red-500',      dot: 'bg-red-500'    },
}

function DocumentIcon() {
  return (
    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
      <path strokeLinecap="round" strokeLinejoin="round"
        d="M19.5 14.25v-2.625a3.375 3.375 0 0 0-3.375-3.375h-1.5A1.125 1.125 0 0 1 13.5 7.125v-1.5
           a3.375 3.375 0 0 0-3.375-3.375H8.25m2.25 0H5.625c-.621 0-1.125.504-1.125 1.125v17.25
           c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 0 0-9-9z" />
    </svg>
  )
}

function FlagIcon() {
  return (
    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M3 3v1.5M3 21v-6m0 0 2.77-.693a9 9 0 0 1 6.208.682l.108.054
        a9 9 0 0 0 6.086.71l3.114-.732a48.524 48.524 0 0 1-.005-10.499l-3.11.732a9 9 0 0 1-6.085-.711
        l-.108-.054a9 9 0 0 0-6.208-.682L3 4.5M3 15V4.5" />
    </svg>
  )
}

function ShieldIcon() {
  return (
    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
      <path strokeLinecap="round" strokeLinejoin="round"
        d="M9 12.75 11.25 15 15 9.75m-3-7.036A11.959 11.959 0 0 1 3.598 6
           11.99 11.99 0 0 0 3 9.749c0 5.592 3.824 10.29 9 11.623
           5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152
           c-3.196 0-6.1-1.248-8.25-3.285z" />
    </svg>
  )
}

function StatCard({ label, value, sub, icon, accent = '' }) {
  return (
    <div className={`rounded-xl border bg-white p-5 flex flex-col gap-3 hover:shadow-md transition-all duration-200 ${accent || 'border-slate-200'}`}>
      <div className="flex items-center justify-between">
        <span className="text-xs font-semibold tracking-wider uppercase text-slate-400">{label}</span>
        <span className="text-slate-300">{icon}</span>
      </div>
      <div>
        <p className="text-3xl font-extrabold text-slate-900 tracking-tight leading-none">{value}</p>
        {sub && <p className="text-xs text-slate-400 mt-1.5">{sub}</p>}
      </div>
    </div>
  )
}

export default function Scorecard({ report }) {
  const { total_clauses, flagged_count, overall_risk_rating, faithfulness_score } = report
  const flaggedPct = total_clauses > 0 ? Math.round((flagged_count / total_clauses) * 100) : 0
  const faithPct   = Math.round(faithfulness_score * 100)
  const rating     = RATING_STYLES[overall_risk_rating] ?? RATING_STYLES.Medium

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
      <StatCard
        label="Total Clauses"
        value={total_clauses}
        sub="extracted from PDF"
        icon={<DocumentIcon />}
      />
      <StatCard
        label="Flagged"
        value={flagged_count}
        sub={`${flaggedPct}% of all clauses`}
        icon={<FlagIcon />}
        accent={flaggedPct > 50 ? 'border-red-200 bg-red-50/40' : 'border-slate-200'}
      />

      {/* Risk rating */}
      <div className={`rounded-xl border p-5 flex flex-col gap-3 hover:shadow-md transition-all duration-200 ${rating.card}`}>
        <div className="flex items-center justify-between">
          <span className="text-xs font-semibold tracking-wider uppercase text-slate-400">Overall Risk</span>
          <span className={rating.sub}><ShieldIcon /></span>
        </div>
        <div>
          <div className="flex items-center gap-2">
            <span className={`w-2 h-2 rounded-full ${rating.dot}`} />
            <p className={`text-3xl font-extrabold tracking-tight leading-none ${rating.text}`}>
              {overall_risk_rating}
            </p>
          </div>
          <p className={`text-xs mt-1.5 ${rating.sub}`}>{flaggedPct}% of clauses flagged</p>
        </div>
      </div>

      {/* Faithfulness */}
      <div className="rounded-xl border border-slate-200 bg-white p-5 flex flex-col gap-3 hover:shadow-md transition-all duration-200">
        <div className="flex items-center justify-between">
          <span className="text-xs font-semibold tracking-wider uppercase text-slate-400">Faithfulness</span>
          <span className="text-slate-300">
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
              <path strokeLinecap="round" strokeLinejoin="round" d="m4.5 12.75 6 6 9-13.5" />
            </svg>
          </span>
        </div>
        <div>
          <p className="text-3xl font-extrabold text-slate-900 tracking-tight leading-none">{faithPct}%</p>
          <div className="mt-2.5 h-1.5 bg-slate-100 rounded-full overflow-hidden">
            <div
              className={`h-full rounded-full transition-all duration-700 delay-300 animate-width ${faithPct >= 65 ? 'bg-emerald-500' : 'bg-amber-400'}`}
              style={{ width: `${faithPct}%` }}
            />
          </div>
          <p className="text-xs text-slate-400 mt-1.5">citation accuracy</p>
        </div>
      </div>
    </div>
  )
}
