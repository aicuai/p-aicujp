"use client"

import { useState } from "react"

export default function RetryRewardsButton() {
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<{ ok: number; failed: number } | null>(null)

  const handleRetry = async () => {
    if (!confirm("失敗したポイント付与をすべてリトライしますか？")) return
    setLoading(true)
    setResult(null)
    try {
      const res = await fetch("/api/admin/retry-rewards", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({}),
      })
      const data = await res.json()
      if (res.ok) {
        setResult({ ok: data.ok ?? 0, failed: data.failed ?? 0 })
        // Reload page to reflect changes
        setTimeout(() => window.location.reload(), 2000)
      } else {
        setResult({ ok: 0, failed: -1 })
      }
    } catch {
      setResult({ ok: 0, failed: -1 })
    } finally {
      setLoading(false)
    }
  }

  return (
    <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
      {result && (
        <span style={{ fontSize: 10, color: result.failed === -1 ? "#ef4444" : "var(--aicu-teal)" }}>
          {result.failed === -1 ? "エラー" : `${result.ok}件成功 / ${result.failed}件失敗`}
        </span>
      )}
      <button
        onClick={handleRetry}
        disabled={loading}
        style={{
          fontSize: 10,
          fontWeight: 600,
          padding: "3px 8px",
          borderRadius: 4,
          border: "1px solid #ef4444",
          background: loading ? "rgba(239,68,68,0.08)" : "transparent",
          color: "#ef4444",
          cursor: loading ? "not-allowed" : "pointer",
        }}
      >
        {loading ? "処理中..." : "全件リトライ"}
      </button>
    </div>
  )
}
