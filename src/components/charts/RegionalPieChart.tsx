"use client"

import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from "recharts"
import MyAnswerBadge, { isMyAnswer } from "./MyAnswerBadge"
import { REGIONAL_BLOCKS, REGIONAL_BLOCK_ORDER, REGIONAL_COLORS } from "@/lib/survey-viz-config"

type Props = {
  counts: Record<string, number>
  answered: number
  myAnswer?: string | string[]
}

export default function RegionalPieChart({ counts, answered, myAnswer }: Props) {
  // Aggregate prefectures into regional blocks
  const blockCounts: Record<string, number> = {}
  for (const [pref, count] of Object.entries(counts)) {
    if (count === 0) continue
    const block = REGIONAL_BLOCKS[pref] || "その他"
    blockCounts[block] = (blockCounts[block] || 0) + count
  }

  const data = REGIONAL_BLOCK_ORDER
    .filter((b) => (blockCounts[b] || 0) > 0)
    .map((name) => ({ name, value: blockCounts[name] }))

  // Add any unlisted blocks
  for (const [name, value] of Object.entries(blockCounts)) {
    if (!REGIONAL_BLOCK_ORDER.includes(name) && value > 0) {
      data.push({ name, value })
    }
  }

  if (data.length === 0) return <div style={{ fontSize: 13, color: "#ccc" }}>回答なし</div>

  // Determine which block "my answer" falls into
  const myBlock = myAnswer && typeof myAnswer === "string" ? REGIONAL_BLOCKS[myAnswer] : undefined

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
              stroke="rgba(255,255,255,0.6)"
              strokeWidth={2}
              label={({ name, percent }: { name?: string; percent?: number }) => (percent ?? 0) > 0.05 ? (name ?? "") : ""}
              labelLine={false}
            >
              {data.map((d, i) => (
                <Cell key={i} fill={REGIONAL_COLORS[d.name] || `hsl(${i * 40}, 60%, 55%)`} />
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
        {data.map((d) => {
          const pct = answered > 0 ? Math.round((d.value / answered) * 100) : 0
          const mine = myBlock === d.name
          return (
            <div key={d.name} style={{
              display: "flex", alignItems: "center", gap: 6, fontSize: 12,
              ...(mine ? { fontWeight: 700 } : {}),
            }}>
              <span style={{
                width: 10, height: 10, borderRadius: "50%", flexShrink: 0,
                background: REGIONAL_COLORS[d.name] || "#999",
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
