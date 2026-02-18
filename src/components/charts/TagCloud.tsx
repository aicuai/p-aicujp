"use client"

import MyAnswerBadge, { isMyAnswer } from "./MyAnswerBadge"

type Props = {
  counts: Record<string, number>
  answered: number
  myAnswer?: string | string[]
}

export default function TagCloud({ counts, answered, myAnswer }: Props) {
  const entries = Object.entries(counts).filter(([, v]) => v > 0).sort((a, b) => b[1] - a[1])
  if (entries.length === 0) return <div style={{ fontSize: 13, color: "#ccc" }}>回答なし</div>

  const maxCount = Math.max(...entries.map(([, v]) => v))
  const minCount = Math.min(...entries.map(([, v]) => v))
  const range = maxCount - minCount || 1

  return (
    <div>
      {/* Cloud */}
      <div style={{
        display: "flex", flexWrap: "wrap", gap: 8, justifyContent: "center",
        padding: "8px 0",
      }}>
        {entries.map(([label, count]) => {
          const pct = answered > 0 ? Math.round((count / answered) * 100) : 0
          const ratio = (count - minCount) / range
          const fontSize = 11 + ratio * 16  // 11px ~ 27px
          const opacity = 0.5 + ratio * 0.5
          const mine = isMyAnswer(myAnswer, label)
          return (
            <span
              key={label}
              title={`${count}件 (${pct}%)`}
              style={{
                fontSize,
                fontWeight: ratio > 0.5 ? 700 : 500,
                color: mine ? "#E65100" : `rgba(0, 49, 216, ${opacity})`,
                padding: "3px 8px",
                borderRadius: 6,
                background: mine
                  ? "rgba(255, 183, 77, 0.15)"
                  : `rgba(65, 201, 180, ${0.05 + ratio * 0.12})`,
                border: mine ? "1.5px solid #FFB74D" : "1px solid transparent",
                cursor: "default",
                transition: "all 0.2s",
                lineHeight: 1.3,
                whiteSpace: "nowrap",
              }}
            >
              {label}
              <span style={{ fontSize: 10, marginLeft: 3, opacity: 0.7 }}>{pct}%</span>
            </span>
          )
        })}
      </div>

      {/* My answer indicator */}
      {myAnswer && (
        <div style={{ marginTop: 8, display: "flex", alignItems: "center", gap: 6, fontSize: 12, color: "#888" }}>
          <MyAnswerBadge />
          <span>= あなたが選択した項目</span>
        </div>
      )}
    </div>
  )
}
