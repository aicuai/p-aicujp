"use client"

import {
  LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, ReferenceLine,
} from "recharts"

type Props = {
  /** Array of { date: "2026-02-01", count: 3 } — daily response counts */
  dailyCounts: { date: string; count: number }[]
  goals?: number[]
}

export default function SurveyProgressChart({ dailyCounts, goals = [100, 200, 300] }: Props) {
  if (dailyCounts.length === 0) {
    return <div style={{ fontSize: 12, color: "var(--text-tertiary)" }}>回答データなし</div>
  }

  // Build cumulative data
  let cumulative = 0
  const data = dailyCounts.map(({ date, count }) => {
    cumulative += count
    return {
      date,
      label: date.slice(5), // "02-01"
      daily: count,
      cumulative,
    }
  })

  const maxCumulative = cumulative
  const yMax = Math.max(maxCumulative, ...goals) * 1.1

  return (
    <div style={{ width: "100%", height: 160 }}>
      <ResponsiveContainer>
        <LineChart data={data} margin={{ left: 0, right: 8, top: 8, bottom: 4 }}>
          <XAxis
            dataKey="label"
            fontSize={10}
            tick={{ fill: "var(--text-tertiary)" }}
            tickLine={false}
            axisLine={{ stroke: "var(--border)" }}
          />
          <YAxis
            fontSize={10}
            tick={{ fill: "var(--text-tertiary)" }}
            tickLine={false}
            axisLine={false}
            width={32}
            domain={[0, yMax]}
          />
          <Tooltip
            contentStyle={{
              fontSize: 11, borderRadius: 6, border: "1px solid var(--border)",
              boxShadow: "0 2px 8px rgba(0,0,0,0.08)",
            }}
            formatter={(value, name) => {
              const label = name === "cumulative" ? "累計" : "日次"
              return [`${value}件`, label]
            }}
            labelFormatter={(label) => `${label}`}
          />
          {/* Goal reference lines */}
          {goals.map((g) => (
            <ReferenceLine
              key={g}
              y={g}
              stroke="rgba(255, 107, 107, 0.3)"
              strokeDasharray="4 3"
              label={{
                value: `${g}`,
                position: "right",
                fontSize: 9,
                fill: "rgba(255, 107, 107, 0.6)",
              }}
            />
          ))}
          {/* Daily bar-like thin line */}
          <Line
            type="monotone"
            dataKey="daily"
            stroke="rgba(0, 49, 216, 0.3)"
            strokeWidth={1}
            dot={false}
            activeDot={{ r: 3 }}
          />
          {/* Cumulative line — main highlight */}
          <Line
            type="monotone"
            dataKey="cumulative"
            stroke="#41C9B4"
            strokeWidth={2}
            dot={false}
            activeDot={{ r: 4, fill: "#41C9B4" }}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  )
}
