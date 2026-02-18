"use client"

import { useState } from "react"

export default function WixEmailExport() {
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<{ count: number; emails: string[] } | null>(null)
  const [toast, setToast] = useState("")

  const showToast = (msg: string) => {
    setToast(msg)
    setTimeout(() => setToast(""), 2500)
  }

  const fetchEmails = async () => {
    setLoading(true)
    try {
      const res = await fetch("/api/admin/wix-emails")
      if (!res.ok) throw new Error(`HTTP ${res.status}`)
      const data = await res.json()
      setResult(data)
      showToast(`${data.count}件のメールアドレスを取得しました`)
    } catch (err) {
      showToast("取得に失敗しました")
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  const copyToClipboard = () => {
    if (!result) return
    navigator.clipboard.writeText(result.emails.join("\n"))
    showToast("クリップボードにコピーしました")
  }

  const downloadCsv = () => {
    if (!result) return
    const csv = "email\n" + result.emails.join("\n")
    const blob = new Blob([csv], { type: "text/csv" })
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = `wix-emails-${new Date().toISOString().slice(0, 10)}.csv`
    a.click()
    URL.revokeObjectURL(url)
  }

  const sendToSlack = async () => {
    setLoading(true)
    try {
      const res = await fetch("/api/admin/wix-emails", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "slack" }),
      })
      if (!res.ok) throw new Error(`HTTP ${res.status}`)
      const data = await res.json()
      showToast(`Slackに${data.count}件送信しました`)
    } catch (err) {
      showToast("Slack送信に失敗しました")
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
      {/* Fetch button */}
      <button
        onClick={fetchEmails}
        disabled={loading}
        style={{
          padding: "10px 16px",
          background: loading ? "var(--text-tertiary)" : "var(--aicu-teal)",
          color: "#fff",
          border: "none",
          borderRadius: "var(--radius-sm)",
          fontSize: 13,
          fontWeight: 600,
          cursor: loading ? "wait" : "pointer",
        }}
      >
        {loading ? "取得中..." : "Wix全会員メール取得"}
      </button>

      {/* Result actions */}
      {result && (
        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          <div style={{ fontSize: 13, color: "var(--text-primary)", fontWeight: 600 }}>
            {result.count}件取得済み
          </div>
          <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
            <ActionButton label="コピー" onClick={copyToClipboard} />
            <ActionButton label="CSV" onClick={downloadCsv} />
            <ActionButton label="Slack送信" onClick={sendToSlack} disabled={loading} />
          </div>
          {/* Preview */}
          <div style={{
            maxHeight: 120,
            overflow: "auto",
            fontSize: 11,
            fontFamily: "monospace",
            color: "var(--text-secondary)",
            background: "rgba(0,0,0,0.02)",
            padding: 8,
            borderRadius: "var(--radius-sm)",
            lineHeight: 1.5,
          }}>
            {result.emails.slice(0, 10).join("\n")}
            {result.count > 10 && `\n... 他${result.count - 10}件`}
          </div>
        </div>
      )}

      {/* Toast */}
      {toast && (
        <div style={{
          padding: "8px 14px",
          background: "var(--aicu-teal)",
          color: "#fff",
          borderRadius: "var(--radius-sm)",
          fontSize: 12,
          fontWeight: 600,
          textAlign: "center",
        }}>
          {toast}
        </div>
      )}
    </div>
  )
}

function ActionButton({ label, onClick, disabled }: { label: string; onClick: () => void; disabled?: boolean }) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      style={{
        padding: "6px 12px",
        background: "var(--bg-card)",
        border: "1px solid var(--border)",
        borderRadius: "var(--radius-sm)",
        fontSize: 12,
        fontWeight: 500,
        color: "var(--text-primary)",
        cursor: disabled ? "wait" : "pointer",
      }}
    >
      {label}
    </button>
  )
}
