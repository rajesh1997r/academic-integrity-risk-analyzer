const RATING_COLORS = {
  Low: 'bg-green-100 text-green-800 border-green-300',
  Medium: 'bg-yellow-100 text-yellow-800 border-yellow-300',
  High: 'bg-red-100 text-red-800 border-red-300',
}

export default function Scorecard({ report }) {
  const { total_clauses, flagged_count, overall_risk_rating, faithfulness_score, risk_distribution } = report
  const flaggedPct = total_clauses > 0 ? Math.round((flagged_count / total_clauses) * 100) : 0
  const faithPct = Math.round(faithfulness_score * 100)
  const ratingColor = RATING_COLORS[overall_risk_rating] ?? RATING_COLORS.Medium

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
      <StatCard label="Total Clauses" value={total_clauses} />
      <StatCard label="Flagged" value={`${flagged_count} (${flaggedPct}%)`} />
      <div className={`rounded-lg border p-4 flex flex-col items-center justify-center ${ratingColor}`}>
        <span className="text-xs font-medium uppercase tracking-wide mb-1">Overall Risk</span>
        <span className="text-2xl font-bold">{overall_risk_rating}</span>
      </div>
      <div className="rounded-lg border border-gray-200 bg-white p-4 flex flex-col">
        <span className="text-xs text-gray-500 uppercase tracking-wide mb-2">Faithfulness</span>
        <span className="text-2xl font-bold text-gray-900">{faithPct}%</span>
        <div className="mt-2 h-2 bg-gray-100 rounded-full overflow-hidden">
          <div
            className={`h-full rounded-full ${faithPct >= 65 ? 'bg-green-500' : 'bg-yellow-500'}`}
            style={{ width: `${faithPct}%` }}
          />
        </div>
      </div>
    </div>
  )
}

function StatCard({ label, value }) {
  return (
    <div className="rounded-lg border border-gray-200 bg-white p-4 flex flex-col">
      <span className="text-xs text-gray-500 uppercase tracking-wide mb-1">{label}</span>
      <span className="text-2xl font-bold text-gray-900">{value}</span>
    </div>
  )
}
