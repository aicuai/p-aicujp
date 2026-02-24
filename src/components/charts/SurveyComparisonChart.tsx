"use client"

import {
  LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, ReferenceLine, Legend,
} from "recharts"

type DataPoint = { day: number; daily: number; cumulative: number; date: string }

type Props = {
  r2511: DataPoint[]
  r2602: DataPoint[]
}

export default function SurveyComparisonChart({ r2511, r2602 }: Props) {
  if (r2511.length === 0 && r2602.length === 0) {
    return <div style={{ fontSize: 12, color: "var(--text-tertiary)" }}>データなし</div>
  }

  // Merge both series into unified data keyed by elapsed day
  const maxDay = Math.max(
    r2511.length > 0 ? r2511[r2511.length - 1].day : 0,
    r2602.length > 0 ? r2602[r2602.length - 1].day : 0,
  )

  // Build lookup maps
  const r2511Map = new Map(r2511.map(d => [d.day, d.cumulative]))
  const r2602Map = new Map(r2602.map(d => [d.day, d.cumulative]))

  // Fill in cumulative values for each day (carry forward last known value)
  const data: { day: number; r2511?: number; r2602?: number }[] = []
  let last2511 = 0
  let last2602 = 0
  for (let d = 0; d <= maxDay; d++) {
    if (r2511Map.has(d)) last2511 = r2511Map.get(d)!
    if (r2602Map.has(d)) last2602 = r2602Map.get(d)!
    // Only include days where at least one survey has data
    const has2511 = d <= (r2511.length > 0 ? r2511[r2511.length - 1].day : -1)
    const has2602 = d <= (r2602.length > 0 ? r2602[r2602.length - 1].day : -1)
    if (has2511 || has2602) {
      data.push({
        day: d,
        r2511: has2511 ? last2511 : undefined,
        r2602: has2602 ? last2602 : undefined,
      })
    }
  }

  const r2511Final = r2511.length > 0 ? r2511[r2511.length - 1].cumulative : 0
  const yMax = Math.max(r2511Final, r2602.length > 0 ? r2602[r2602.length - 1].cumulative : 0, 53) * 1.15

  return (
    <div style={{ width: "100%", height: 180 }}>
      <ResponsiveContainer>
        <LineChart data={data} margin={{ left: 0, right: 8, top: 8, bottom: 4 }}>
          <XAxis
            dataKey="day"
            fontSize={10}
            tick={{ fill: "var(--text-tertiary)" }}
            tickLine={false}
            axisLine={{ stroke: "var(--border)" }}
            label={{ value: "経過日数", position: "insideBottomRight", fontSize: 9, fill: "var(--text-tertiary)", offset: -2 }}
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
              const label = name === "r2511" ? "R2511" : "R2602"
              return [`${value}件`, label]
            }}
            labelFormatter={(label) => `${label}日目`}
          />
          <Legend
            iconType="line"
            wrapperStyle={{ fontSize: 10, paddingTop: 4 }}
            formatter={(value) => value === "r2511" ? "R2511 (n=53)" : "R2602"}
          />
          {/* R2511 final count reference */}
          <ReferenceLine
            y={53}
            stroke="rgba(136, 132, 216, 0.3)"
            strokeDasharray="4 3"
            label={{
              value: "R2511最終: 53",
              position: "right",
              fontSize: 9,
              fill: "rgba(136, 132, 216, 0.6)",
            }}
          />
          <Line
            type="monotone"
            dataKey="r2511"
            stroke="#8884d8"
            strokeWidth={2}
            strokeDasharray="6 3"
            dot={false}
            activeDot={{ r: 3, fill: "#8884d8" }}
            connectNulls={false}
          />
          <Line
            type="monotone"
            dataKey="r2602"
            stroke="#41C9B4"
            strokeWidth={2}
            dot={false}
            activeDot={{ r: 4, fill: "#41C9B4" }}
            connectNulls={false}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  )
}
