"use client"

import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from "recharts"
import MyAnswerBadge, { isMyAnswer } from "./MyAnswerBadge"
import { CHART_COLORS } from "@/lib/survey-viz-config"

type Props = {
  counts: Record<string, number>
  answered: number
  myAnswer?: string | string[]
}

export default function DonutChart({ counts, answered, myAnswer }: Props) {
  const entries = Object.entries(counts).filter(([, v]) => v > 0).sort((a, b) => b[1] - a[1])
  if (entries.length === 0) return <div style={{ fontSize: 13, color: "#ccc" }}>回答なし</div>

  const data = entries.map(([name, value]) => ({ name, value }))

  return (
    <div>
      <div style={{ width: "100%", height: 220 }}>
        <ResponsiveContainer>
          <PieChart>
            <Pie
              data={data}
              cx="50%"
              cy="50%"
              innerRadius="45%"
              outerRadius="80%"
              dataKey="value"
              startAngle={90}
              endAngle={-270}
              stroke="rgba(255,255,255,0.6)"
              strokeWidth={2}
              label={({ x, y, name, percent }: { x?: number; y?: number; name?: string; percent?: number }) => {
                const p = percent ?? 0
                if (p < 0.06) return null
                const short = (name ?? "").length > 8 ? (name ?? "").slice(0, 7) + "…" : (name ?? "")
                const text = `${short} ${Math.round(p * 100)}%`
                return (
                  <text x={x} y={y} textAnchor="middle" dominantBaseline="central" fontSize={11} fontWeight={600}>
                    <tspan stroke="#fff" strokeWidth={3} paintOrder="stroke">{text}</tspan>
                    <tspan x={x} fill="#333">{text}</tspan>
                  </text>
                )
              }}
              labelLine={false}
            >
              {data.map((_, i) => (
                <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />
              ))}
            </Pie>
            <Tooltip
              formatter={(value) => {
                const v = Number(value) || 0
                const pct = answered > 0 ? Math.round((v / answered) * 100) : 0
                return [`${v}件 (${pct}%)`, "回答数"]
              }}
              contentStyle={{ fontSize: 12, borderRadius: 8 }}
            />
          </PieChart>
        </ResponsiveContainer>
      </div>

      {/* Legend */}
      <div style={{ display: "flex", flexDirection: "column", gap: 4, marginTop: 4 }}>
        {entries.map(([label, count], i) => {
          const pct = answered > 0 ? Math.round((count / answered) * 100) : 0
          const mine = isMyAnswer(myAnswer, label)
          return (
            <div key={label} style={{
              display: "flex", alignItems: "center", gap: 6, fontSize: 12,
              padding: mine ? "2px 4px" : undefined,
              background: mine ? "rgba(255, 183, 77, 0.1)" : undefined,
              borderRadius: mine ? 4 : undefined,
            }}>
              <span style={{
                width: 10, height: 10, borderRadius: "50%", flexShrink: 0,
                background: CHART_COLORS[i % CHART_COLORS.length],
                border: mine ? "2px solid #E65100" : undefined,
              }} />
              <span style={{ color: "#333", flex: 1, minWidth: 0, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{label}</span>
              <span style={{ color: "#888", fontWeight: 600, whiteSpace: "nowrap" }}>{count} ({pct}%)</span>
              {mine && <MyAnswerBadge />}
            </div>
          )
        })}
      </div>
    </div>
  )
}
