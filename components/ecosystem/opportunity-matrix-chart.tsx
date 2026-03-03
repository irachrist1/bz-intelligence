'use client'

import {
  CartesianGrid,
  Cell,
  ResponsiveContainer,
  Scatter,
  ScatterChart,
  Tooltip,
  XAxis,
  YAxis,
  ZAxis,
} from 'recharts'

type Point = {
  industry: string
  momentumScore: number
  investabilityScore: number
  companyCount: number
  trendLabel: string
}

const COLORS = ['#0ea5e9', '#22c55e', '#f59e0b', '#a855f7', '#ef4444', '#14b8a6', '#f97316']

export function OpportunityMatrixChart({ data }: { data: Point[] }) {
  if (data.length === 0) {
    return (
      <div className="h-[300px] rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 flex items-center justify-center text-sm text-zinc-500 dark:text-zinc-400">
        No matrix data yet.
      </div>
    )
  }

  return (
    <div className="h-[320px] rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-3">
      <ResponsiveContainer width="100%" height="100%">
        <ScatterChart margin={{ top: 10, right: 20, bottom: 10, left: 0 }}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis type="number" dataKey="momentumScore" name="Momentum" domain={[0, 100]} />
          <YAxis type="number" dataKey="investabilityScore" name="Investability" domain={[0, 100]} />
          <ZAxis type="number" dataKey="companyCount" range={[120, 800]} />
          <Tooltip
            cursor={{ strokeDasharray: '3 3' }}
            contentStyle={{ borderRadius: 12 }}
            labelFormatter={(_label, payload) => {
              const row = payload?.[0]?.payload as Point | undefined
              return row ? `${row.industry} (${row.companyCount} companies)` : ''
            }}
          />
          <Scatter data={data} name="Sectors">
            {data.map((entry, index) => (
              <Cell key={entry.industry} fill={COLORS[index % COLORS.length]} />
            ))}
          </Scatter>
        </ScatterChart>
      </ResponsiveContainer>
    </div>
  )
}
