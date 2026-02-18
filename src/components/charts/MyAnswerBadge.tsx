"use client"

export default function MyAnswerBadge() {
  return (
    <span style={{
      display: "inline-flex", alignItems: "center", gap: 3,
      background: "#FFF3E0", border: "1px solid #FFB74D", borderRadius: 4,
      padding: "1px 6px", fontSize: 10, fontWeight: 700, color: "#E65100",
      lineHeight: "16px", whiteSpace: "nowrap", verticalAlign: "middle",
    }}>
      ★ あなた
    </span>
  )
}

export function isMyAnswer(myAnswer: string | string[] | undefined, label: string): boolean {
  if (!myAnswer) return false
  if (Array.isArray(myAnswer)) return myAnswer.includes(label)
  return myAnswer === label
}
