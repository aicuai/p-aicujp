"use client"

import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Legend, Cell } from "recharts"
import MyAnswerBadge, { isMyAnswer } from "./MyAnswerBadge"

type Props = {
  doneCounts: Record<string, number>
  wantCounts: Record<string, number>
  doneAnswered: number
  wantAnswered: number
  myDone?: string | string[]
  myWant?: string | string[]
}

const DONE_COLOR = "#41C9B4"
const WANT_COLOR = "#0031D8"

export default function PairedBarChart({ doneCounts, wantCounts, doneAnswered, wantAnswered, myDone, myWant }: Props) {
  // Merge all labels from both
  const allLabels = new Set([...Object.keys(doneCounts), ...Object.keys(wantCounts)])
  const data = Array.from(allLabels).map((label) => ({
    label,
    done: doneCounts[label] || 0,
    want: wantCounts[label] || 0,
    donePct: doneAnswered > 0 ? Math.round(((doneCounts[label] || 0) / doneAnswered) * 100) : 0,
    wantPct: wantAnswered > 0 ? Math.round(((wantCounts[label] || 0) / wantAnswered) * 100) : 0,
  }))

  if (data.length === 0) return <div style={{ fontSize: 13, color: "#ccc" }}>回答なし</div>

  return (
    <div>
      <div style={{ width: "100%", height: Math.max(250, data.length * 40 + 60) }}>
        <ResponsiveContainer>
          <BarChart data={data} layout="vertical" margin={{ left: 10, right: 20, top: 5, bottom: 5 }}>
            <XAxis type="number" fontSize={11} tickFormatter={(v) => `${v}`} />
            <YAxis
              type="category"
              dataKey="label"
              width={100}
              fontSize={11}
              tick={{ fill: "#333" }}
            />
            <Tooltip
              formatter={(value, name) => {
                const v = Number(value) || 0
                const total = name === "done" ? doneAnswered : wantAnswered
                const pct = total > 0 ? Math.round((v / total) * 100) : 0
                return [`${v}件 (${pct}%)`, name === "done" ? "実現済み" : "期待"]
              }}
              contentStyle={{ fontSize: 12, borderRadius: 8 }}
            />
            <Legend
              formatter={(value) => value === "done" ? "実現済み" : "今後期待"}
              wrapperStyle={{ fontSize: 12 }}
            />
            <Bar dataKey="done" fill={DONE_COLOR} radius={[0, 4, 4, 0]} barSize={14}>
              {data.map((d, i) => (
                <Cell
                  key={i}
                  fill={DONE_COLOR}
                  stroke={isMyAnswer(myDone, d.label) ? "#E65100" : undefined}
                  strokeWidth={isMyAnswer(myDone, d.label) ? 2 : 0}
                />
              ))}
            </Bar>
            <Bar dataKey="want" fill={WANT_COLOR} radius={[0, 4, 4, 0]} barSize={14}>
              {data.map((d, i) => (
                <Cell
                  key={i}
                  fill={WANT_COLOR}
                  stroke={isMyAnswer(myWant, d.label) ? "#E65100" : undefined}
                  strokeWidth={isMyAnswer(myWant, d.label) ? 2 : 0}
                />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Gap analysis text */}
      {data.some((d) => Math.abs(d.wantPct - d.donePct) >= 10) && (
        <div style={{ marginTop: 8, fontSize: 12, color: "#666", lineHeight: 1.6 }}>
          <span style={{ fontWeight: 600, color: "#333" }}>ギャップ分析: </span>
          {data
            .filter((d) => d.wantPct - d.donePct >= 10)
            .sort((a, b) => (b.wantPct - b.donePct) - (a.wantPct - a.donePct))
            .slice(0, 3)
            .map((d) => `${d.label}(+${d.wantPct - d.donePct}pt)`)
            .join("、")}
          {" "}に期待が大きい
        </div>
      )}

      {(myDone || myWant) && (
        <div style={{ marginTop: 4 }}>
          <MyAnswerBadge /> <span style={{ fontSize: 12, color: "#888" }}>= あなたの回答</span>
        </div>
      )}
    </div>
  )
}
