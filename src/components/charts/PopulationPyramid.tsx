"use client"

import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell, ReferenceLine } from "recharts"
import { birthYearToBucket, AGE_BUCKET_ORDER } from "@/lib/survey-viz-config"

type Props = {
  /** Raw birth year counts: { "1990": 5, ... } */
  birthYearCounts: Record<string, number>
  /** Gender counts: { "男性": N, "女性": N, "その他": N } */
  genderCounts: Record<string, number>
  /** Raw responses with both birth year and gender */
  crossData: { birthYear: string; gender: string }[]
  answered: number
}

const MALE_COLOR = "#4D96FF"
const FEMALE_COLOR = "#FF6B6B"
const OTHER_COLOR = "#FFD93D"

export default function PopulationPyramid({ crossData, answered }: Props) {
  // Cross-tabulate: age bucket × gender
  const buckets: Record<string, { male: number; female: number; other: number }> = {}
  for (const b of AGE_BUCKET_ORDER) {
    buckets[b] = { male: 0, female: 0, other: 0 }
  }

  for (const { birthYear, gender } of crossData) {
    const year = parseInt(birthYear, 10)
    if (isNaN(year)) continue
    const bucket = birthYearToBucket(year)
    if (!buckets[bucket]) buckets[bucket] = { male: 0, female: 0, other: 0 }
    if (gender === "男性") buckets[bucket].male++
    else if (gender === "女性") buckets[bucket].female++
    else buckets[bucket].other++
  }

  // Pyramid data: male goes left (negative), female goes right (positive)
  const data = AGE_BUCKET_ORDER.map((name) => ({
    name,
    male: -(buckets[name]?.male || 0),
    female: buckets[name]?.female || 0,
    other: buckets[name]?.other || 0,
  })).filter((d) => d.male !== 0 || d.female !== 0 || d.other !== 0)

  if (data.length === 0) return <div style={{ fontSize: 13, color: "#ccc" }}>回答なし</div>

  const maxVal = Math.max(
    ...data.map((d) => Math.max(Math.abs(d.male), d.female + d.other)),
    1,
  )

  return (
    <div>
      <div style={{ width: "100%", height: Math.max(200, data.length * 40 + 40) }}>
        <ResponsiveContainer>
          <BarChart data={data} layout="vertical" margin={{ left: 10, right: 10, top: 5, bottom: 5 }} stackOffset="sign">
            <XAxis
              type="number"
              domain={[-maxVal - 1, maxVal + 1]}
              tickFormatter={(v) => `${Math.abs(v)}`}
              fontSize={11}
            />
            <YAxis
              type="category"
              dataKey="name"
              width={60}
              fontSize={12}
              tick={{ fill: "#333" }}
            />
            <Tooltip
              formatter={(value, name) => {
                const v = Math.abs(Number(value))
                const label = name === "male" ? "男性" : name === "female" ? "女性" : "その他"
                return [`${v}人`, label]
              }}
              contentStyle={{ fontSize: 12, borderRadius: 8 }}
            />
            <ReferenceLine x={0} stroke="#ccc" />
            <Bar dataKey="male" stackId="stack" barSize={20} radius={[4, 0, 0, 4]}>
              {data.map((_, i) => (
                <Cell key={i} fill={MALE_COLOR} />
              ))}
            </Bar>
            <Bar dataKey="female" stackId="stack" barSize={20} radius={[0, 4, 4, 0]}>
              {data.map((_, i) => (
                <Cell key={i} fill={FEMALE_COLOR} />
              ))}
            </Bar>
            <Bar dataKey="other" stackId="stack" barSize={20} radius={[0, 4, 4, 0]}>
              {data.map((_, i) => (
                <Cell key={i} fill={OTHER_COLOR} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Legend */}
      <div style={{ display: "flex", justifyContent: "center", gap: 20, marginTop: 8, fontSize: 12 }}>
        {[
          { label: "男性", color: MALE_COLOR },
          { label: "女性", color: FEMALE_COLOR },
          { label: "その他", color: OTHER_COLOR },
        ].map((l) => (
          <div key={l.label} style={{ display: "flex", alignItems: "center", gap: 4 }}>
            <span style={{ width: 10, height: 10, borderRadius: 2, background: l.color }} />
            <span style={{ color: "#555" }}>{l.label}</span>
          </div>
        ))}
        <span style={{ color: "#999" }}>({answered}件)</span>
      </div>
    </div>
  )
}
