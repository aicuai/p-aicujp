"use client"

import {
  AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid,
} from "recharts"

type DataPoint = {
  date: string
  users: number
  pageviews: number
}

type Props = {
  data: DataPoint[]
}

export default function GA4TrendChart({ data }: Props) {
  if (data.length === 0) {
    return <div style={{ fontSize: 12, color: "var(--text-tertiary)" }}>データなし</div>
  }

  const chartData = data.map((d) => ({
    ...d,
    label: d.date.length === 8
      ? `${d.date.slice(4, 6)}/${d.date.slice(6, 8)}`
      : d.date.slice(5),
  }))

  return (
    <div style={{ width: "100%", height: 200 }}>
      <ResponsiveContainer>
        <AreaChart data={chartData} margin={{ left: 0, right: 8, top: 8, bottom: 4 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
          <XAxis
            dataKey="label"
            fontSize={10}
            tick={{ fill: "var(--text-tertiary)" }}
            tickLine={false}
            axisLine={{ stroke: "var(--border)" }}
          />
          <YAxis
            fontSize={10}
            tick={{ fill: "var(--text-tertiary)" }}
            tickLine={false}
            axisLine={false}
            width={36}
          />
          <Tooltip
            contentStyle={{
              fontSize: 11, borderRadius: 6, border: "1px solid var(--border)",
              boxShadow: "0 2px 8px rgba(0,0,0,0.08)",
            }}
            formatter={(value, name) => {
              const label = name === "users" ? "ユーザー" : "PV"
              return [`${value}`, label]
            }}
          />
          <Area
            type="monotone"
            dataKey="pageviews"
            stroke="rgba(0, 49, 216, 0.5)"
            fill="rgba(0, 49, 216, 0.08)"
            strokeWidth={1.5}
            dot={false}
          />
          <Area
            type="monotone"
            dataKey="users"
            stroke="#41C9B4"
            fill="rgba(65, 201, 180, 0.12)"
            strokeWidth={2}
            dot={false}
            activeDot={{ r: 3, fill: "#41C9B4" }}
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  )
}
