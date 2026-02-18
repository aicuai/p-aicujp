"use client"

import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from "recharts"
import MyAnswerBadge from "./MyAnswerBadge"
import { birthYearToBucket, AGE_BUCKET_ORDER, CHART_COLORS } from "@/lib/survey-viz-config"

type Props = {
  /** Raw birth year counts: { "1990": 5, "1985": 3, ... } */
  birthYearCounts: Record<string, number>
  answered: number
  myAnswer?: string | string[]
}

const AGE_COLORS = ["#6BCB77", "#41C9B4", "#4D96FF", "#0031D8", "#FF922B", "#FF6B6B"]

export default function AgeBucketChart({ birthYearCounts, answered, myAnswer }: Props) {
  // Aggregate birth years into age buckets
  const bucketCounts: Record<string, number> = {}
  for (const bucket of AGE_BUCKET_ORDER) bucketCounts[bucket] = 0

  for (const [yearStr, count] of Object.entries(birthYearCounts)) {
    const year = parseInt(yearStr, 10)
    if (isNaN(year) || count === 0) continue
    const bucket = birthYearToBucket(year)
    bucketCounts[bucket] = (bucketCounts[bucket] || 0) + count
  }

  const data = AGE_BUCKET_ORDER
    .filter((b) => (bucketCounts[b] || 0) > 0)
    .map((name) => ({ name, value: bucketCounts[name] }))

  if (data.length === 0) return <div style={{ fontSize: 13, color: "#ccc" }}>回答なし</div>

  // Determine which bucket the user falls into
  const myBucket = myAnswer && typeof myAnswer === "string" && !isNaN(parseInt(myAnswer, 10))
    ? birthYearToBucket(parseInt(myAnswer, 10))
    : undefined

  return (
    <div>
      <div style={{ width: "100%", height: 220 }}>
        <ResponsiveContainer>
          <PieChart>
            <Pie
              data={data}
              cx="50%"
              cy="50%"
              innerRadius="40%"
              outerRadius="80%"
              dataKey="value"
              startAngle={90}
              endAngle={-270}
              stroke="rgba(255,255,255,0.6)"
              strokeWidth={2}
              label={({ x, y, name, percent }: { x?: number; y?: number; name?: string; percent?: number }) => {
                const p = percent ?? 0
                if (p < 0.05) return null
                const text = `${name ?? ""} ${Math.round(p * 100)}%`
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
                <Cell key={i} fill={AGE_COLORS[i % AGE_COLORS.length]} />
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

      <div style={{ display: "flex", flexWrap: "wrap", gap: "4px 16px", marginTop: 4 }}>
        {data.map((d, i) => {
          const pct = answered > 0 ? Math.round((d.value / answered) * 100) : 0
          const mine = myBucket === d.name
          return (
            <div key={d.name} style={{
              display: "flex", alignItems: "center", gap: 6, fontSize: 12,
              ...(mine ? { fontWeight: 700 } : {}),
            }}>
              <span style={{
                width: 10, height: 10, borderRadius: "50%", flexShrink: 0,
                background: AGE_COLORS[i % AGE_COLORS.length],
                border: mine ? "2px solid #E65100" : undefined,
              }} />
              <span style={{ color: "#333" }}>{d.name}</span>
              <span style={{ color: "#888", fontWeight: 600 }}>{d.value} ({pct}%)</span>
              {mine && <MyAnswerBadge />}
            </div>
          )
        })}
      </div>
    </div>
  )
}
