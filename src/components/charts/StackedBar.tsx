"use client"

import MyAnswerBadge, { isMyAnswer } from "./MyAnswerBadge"
import { CHART_COLORS } from "@/lib/survey-viz-config"

type Props = {
  counts: Record<string, number>
  answered: number
  myAnswer?: string | string[]
}

export default function StackedBar({ counts, answered, myAnswer }: Props) {
  const entries = Object.entries(counts).filter(([, v]) => v > 0)
  const total = entries.reduce((s, [, v]) => s + v, 0)
  if (total === 0) return <div style={{ fontSize: 13, color: "#ccc" }}>回答なし</div>

  return (
    <div>
      {/* Stacked bar */}
      <div style={{
        display: "flex", height: 36, borderRadius: 6, overflow: "hidden",
        border: "1px solid rgba(0,0,0,0.06)",
      }}>
        {entries.map(([label, count], i) => {
          const pct = (count / total) * 100
          if (pct < 0.5) return null
          return (
            <div key={label} style={{
              width: `${pct}%`, background: CHART_COLORS[i % CHART_COLORS.length],
              display: "flex", alignItems: "center", justifyContent: "center",
              fontSize: 11, fontWeight: 600, color: "#fff",
              minWidth: pct > 5 ? 0 : undefined,
              borderRight: i < entries.length - 1 ? "1px solid rgba(255,255,255,0.3)" : undefined,
            }}>
              {pct >= 8 ? `${Math.round(pct)}%` : ""}
            </div>
          )
        })}
      </div>

      {/* Legend */}
      <div style={{ display: "flex", flexWrap: "wrap", gap: "6px 16px", marginTop: 10 }}>
        {entries.map(([label, count], i) => {
          const pct = answered > 0 ? Math.round((count / answered) * 100) : 0
          const mine = isMyAnswer(myAnswer, label)
          return (
            <div key={label} style={{
              display: "flex", alignItems: "center", gap: 6, fontSize: 12,
              ...(mine ? { fontWeight: 700 } : {}),
            }}>
              <span style={{
                width: 10, height: 10, borderRadius: 2, flexShrink: 0,
                background: CHART_COLORS[i % CHART_COLORS.length],
                border: mine ? "2px solid #E65100" : undefined,
              }} />
              <span style={{ color: "#333" }}>{label}</span>
              <span style={{ color: "#888", fontWeight: 600 }}>{count} ({pct}%)</span>
              {mine && <MyAnswerBadge />}
            </div>
          )
        })}
      </div>
    </div>
  )
}
