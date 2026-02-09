"use client"

import { useState } from "react"

export default function LinkWixForm() {
  const [wixEmail, setWixEmail] = useState("")
  const [status, setStatus] = useState<"idle" | "loading" | "success" | "error">("idle")
  const [message, setMessage] = useState("")

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!wixEmail.trim()) return

    setStatus("loading")
    setMessage("")

    try {
      const res = await fetch("/api/link-wix", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ wixEmail: wixEmail.trim() }),
      })
      const data = await res.json()

      if (res.ok) {
        setStatus("success")
        setMessage(`連携完了: Contact ID = ${data.wix_contact_id}`)
      } else {
        setStatus("error")
        setMessage(data.error || "連携に失敗しました")
      }
    } catch {
      setStatus("error")
      setMessage("通信エラーが発生しました")
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-3">
      <div className="flex gap-2">
        <input
          type="email"
          value={wixEmail}
          onChange={(e) => setWixEmail(e.target.value)}
          placeholder="Wix メールアドレス"
          className="flex-1 px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white text-sm placeholder-gray-400 focus:outline-none focus:border-aicu-primary"
          required
        />
        <button
          type="submit"
          disabled={status === "loading"}
          className="px-4 py-2 bg-aicu-primary text-white rounded-lg text-sm font-medium hover:bg-aicu-primary/80 disabled:opacity-50 transition-colors"
        >
          {status === "loading" ? "検索中..." : "連携"}
        </button>
      </div>
      {message && (
        <p className={`text-xs ${status === "success" ? "text-green-400" : "text-red-400"}`}>
          {message}
        </p>
      )}
    </form>
  )
}
