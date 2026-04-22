import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts'

const COLORS = {
  Ambiguity:          '#6366f1',
  UndefinedTerm:      '#f59e0b',
  EnforcementGap:     '#ef4444',
  ScopeConflict:      '#8b5cf6',
  AuthorityConflict:  '#3b82f6',
  AIUsageLoophole:    '#14b8a6',
  CircularDefinition: '#f97316',
}

function CustomTooltip({ active, payload }) {
  if (!active || !payload?.length) return null
  const { category, count } = payload[0].payload
  return (
    <div className="bg-white border border-slate-200 rounded-xl shadow-lg px-3.5 py-2.5">
      <p className="text-xs font-semibold text-slate-800">{category}</p>
      <p className="text-xs text-slate-500 mt-0.5">
        {count} clause{count !== 1 ? 's' : ''}
      </p>
    </div>
  )
}

export default function RiskHeatmap({ distribution }) {
  const data = Object.entries(distribution)
    .filter(([cat, count]) => count > 0 && cat !== 'None')
    .map(([category, count]) => ({ category, count }))
    .sort((a, b) => b.count - a.count)

  if (data.length === 0) return null

  const total = data.reduce((s, d) => s + d.count, 0)

  return (
    <div className="bg-white rounded-xl border border-slate-200 p-6 mb-8 shadow-sm">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-sm font-semibold text-slate-700">Risk Distribution</h3>
        <span className="text-xs text-slate-400 bg-slate-100 px-2.5 py-1 rounded-full">
          {total} flagged clauses
        </span>
      </div>
      <ResponsiveContainer width="100%" height={Math.max(180, data.length * 40)}>
        <BarChart data={data} layout="vertical" margin={{ left: 0, right: 36, top: 0, bottom: 0 }}>
          <XAxis
            type="number"
            tick={{ fontSize: 11, fill: '#94a3b8' }}
            axisLine={false}
            tickLine={false}
          />
          <YAxis
            type="category"
            dataKey="category"
            width={155}
            tick={{ fontSize: 12, fill: '#475569' }}
            axisLine={false}
            tickLine={false}
          />
          <Tooltip content={<CustomTooltip />} cursor={{ fill: 'rgba(99,102,241,0.04)' }} />
          <Bar dataKey="count" radius={[0, 6, 6, 0]} maxBarSize={20}>
            {data.map(({ category }) => (
              <Cell key={category} fill={COLORS[category] ?? '#94a3b8'} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  )
}
