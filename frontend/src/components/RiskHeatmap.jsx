import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts'

const CATEGORY_COLORS = {
  Ambiguity: '#6366f1',
  UndefinedTerm: '#f59e0b',
  EnforcementGap: '#ef4444',
  ScopeConflict: '#8b5cf6',
  AuthorityConflict: '#ec4899',
  AIUsageLoophole: '#14b8a6',
  CircularDefinition: '#f97316',
  None: '#9ca3af',
}

export default function RiskHeatmap({ distribution }) {
  const data = Object.entries(distribution)
    .filter(([, count]) => count > 0)
    .map(([category, count]) => ({ category, count }))
    .sort((a, b) => b.count - a.count)

  if (data.length === 0) return null

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-4 mb-6">
      <h3 className="text-sm font-semibold text-gray-700 mb-4">Risk Category Distribution</h3>
      <ResponsiveContainer width="100%" height={220}>
        <BarChart data={data} layout="vertical" margin={{ left: 20, right: 20 }}>
          <XAxis type="number" tick={{ fontSize: 12 }} />
          <YAxis type="category" dataKey="category" width={140} tick={{ fontSize: 12 }} />
          <Tooltip
            formatter={(value) => [value, 'Clauses']}
            contentStyle={{ fontSize: 12 }}
          />
          <Bar dataKey="count" radius={[0, 4, 4, 0]}>
            {data.map(({ category }) => (
              <Cell key={category} fill={CATEGORY_COLORS[category] ?? '#6b7280'} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  )
}
