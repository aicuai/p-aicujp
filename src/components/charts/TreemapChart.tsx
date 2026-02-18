"use client"

import { Treemap, ResponsiveContainer, Tooltip } from "recharts"
import { CHART_COLORS } from "@/lib/survey-viz-config"
import MyAnswerBadge, { isMyAnswer } from "./MyAnswerBadge"

type Props = {
  counts: Record<string, number>
  answered: number
  myAnswer?: string | string[]
}

type TreeNode = {
  name: string
  size: number
  pct: number
  mine: boolean
}

// Custom content renderer for treemap cells
function CustomCell(props: Record<string, unknown>) {
  const { x, y, width, height, index, name, pct, mine } = props as {
    x: number; y: number; width: number; height: number
    index: number; name: string; pct: number; mine: boolean
  }
  if (width < 4 || height < 4) return null

  const color = mine ? "#FF922B" : CHART_COLORS[index % CHART_COLORS.length]
  const showLabel = width > 40 && height > 24
  const showPct = width > 50 && height > 36
  // Truncate label to fit
  const maxChars = Math.floor(width / 11)
  const label = name.length > maxChars ? name.slice(0, maxChars) + "…" : name

  return (
    <g>
      <rect
        x={x} y={y} width={width} height={height}
        rx={4} ry={4}
        fill={color}
        stroke={mine ? "#E65100" : "#fff"}
        strokeWidth={mine ? 2 : 1}
        opacity={mine ? 1 : 0.85}
      />
      {showLabel && (
        <text
          x={x + width / 2} y={y + height / 2 - (showPct ? 6 : 0)}
          textAnchor="middle" dominantBaseline="central"
          fontSize={Math.min(12, width / 6)} fontWeight={600}
          fill="#fff"
        >
          <tspan stroke="rgba(0,0,0,0.4)" strokeWidth={2} paintOrder="stroke">{label}</tspan>
        </text>
      )}
      {showPct && (
        <text
          x={x + width / 2} y={y + height / 2 + 10}
          textAnchor="middle" dominantBaseline="central"
          fontSize={10} fill="rgba(255,255,255,0.85)"
        >
          {pct}%
        </text>
      )}
    </g>
  )
}

export default function TreemapChart({ counts, answered, myAnswer }: Props) {
  const entries = Object.entries(counts)
    .filter(([, v]) => v > 0)
    .sort((a, b) => b[1] - a[1])

  if (entries.length === 0) return <div style={{ fontSize: 13, color: "#ccc" }}>回答なし</div>

  const treeData: TreeNode[] = entries.map(([label, count]) => ({
    name: label,
    size: count,
    pct: answered > 0 ? Math.round((count / answered) * 100) : 0,
    mine: isMyAnswer(myAnswer, label),
  }))

  return (
    <div>
      <div style={{ width: "100%", height: Math.min(500, Math.max(280, entries.length * 8)) }}>
        <ResponsiveContainer>
          <Treemap
            data={treeData}
            dataKey="size"
            aspectRatio={4 / 3}
            content={<CustomCell />}
          >
            <Tooltip
              content={({ payload }) => {
                if (!payload || payload.length === 0) return null
                const d = payload[0].payload as TreeNode
                return (
                  <div style={{
                    background: "#fff", border: "1px solid #e0e0e0", borderRadius: 8,
                    padding: "8px 12px", fontSize: 12, boxShadow: "0 2px 8px rgba(0,0,0,0.1)",
                  }}>
                    <div style={{ fontWeight: 600, marginBottom: 2 }}>{d.name}</div>
                    <div style={{ color: "#666" }}>{d.size}件 ({d.pct}%)</div>
                  </div>
                )
              }}
            />
          </Treemap>
        </ResponsiveContainer>
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
