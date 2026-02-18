"use client"

import MyAnswerBadge, { isMyAnswer } from "./MyAnswerBadge"

type Props = {
  counts: Record<string, number>
  answered: number
  isMulti: boolean
  myAnswer?: string | string[]
}

// Single-choice: AICU teal base with descending opacity
function singleColor(rank: number): string {
  const opacity = Math.max(0.25, 1 - rank * 0.12)
  return `rgba(65, 201, 180, ${opacity})`
}

// Multi-choice: AICU blue base with descending opacity
function multiColor(rank: number): string {
  const opacity = Math.max(0.25, 1 - rank * 0.1)
  return `rgba(0, 49, 216, ${opacity})`
}

export default function HorizontalBarChart({ counts, answered, isMulti, myAnswer }: Props) {
  const entries = Object.entries(counts)
    .filter(([label, v]) => v > 0 && !label.startsWith("─"))
    .sort((a, b) => b[1] - a[1])
  const maxVal = entries.length > 0 ? Math.max(...entries.map(([, v]) => v)) : 1

  if (entries.length === 0) return <div style={{ fontSize: 13, color: "#ccc" }}>回答なし</div>

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
      {entries.map(([label, count], i) => {
        const pct = answered > 0 ? Math.round((count / answered) * 100) : 0
        const barWidth = maxVal > 0 ? (count / maxVal) * 100 : 0
        const color = isMulti ? multiColor(i) : singleColor(i)
        const mine = isMyAnswer(myAnswer, label)
        return (
          <div key={label}>
            <div style={{
              display: "flex", justifyContent: "space-between", fontSize: 13, marginBottom: 4,
              ...(mine ? { fontWeight: 700 } : {}),
            }}>
              <span style={{
                color: mine ? "#E65100" : "#333", flex: 1, minWidth: 0,
                overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
                display: "flex", alignItems: "center", gap: 4,
              }}>
                {label}
                {mine && <MyAnswerBadge />}
              </span>
              <span style={{ color: "#666", fontWeight: 600, marginLeft: 8, whiteSpace: "nowrap" }}>
                {count} ({pct}%)
              </span>
            </div>
            <div style={{
              height: 20, background: "rgba(0,0,0,0.04)", borderRadius: 4, overflow: "hidden",
              border: mine ? "1.5px solid #FFB74D" : undefined,
            }}>
              <div style={{
                height: "100%", borderRadius: 4,
                background: mine ? "#FF922B" : color,
                width: `${barWidth}%`,
                transition: "width 0.5s ease",
                minWidth: count > 0 ? 2 : 0,
              }} />
            </div>
          </div>
        )
      })}
    </div>
  )
}
