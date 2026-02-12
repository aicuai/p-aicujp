"use client"

import { useState } from "react"

type Status = "idle" | "loading" | "success" | "error"

export default function UnsubscribeClient({
  email,
  token,
}: {
  email: string
  token: string
}) {
  const [status, setStatus] = useState<Status>("idle")
  const [errorMsg, setErrorMsg] = useState("")

  const handleUnsubscribe = async () => {
    if (!email || !token) return
    setStatus("loading")
    try {
      const res = await fetch("/api/mailnews/unsubscribe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, token }),
      })
      const data = await res.json()
      if (data.success) {
        setStatus("success")
      } else {
        setErrorMsg(data.error || "処理に失敗しました")
        setStatus("error")
      }
    } catch {
      setErrorMsg("通信エラーが発生しました")
      setStatus("error")
    }
  }

  if (!email || !token) {
    return (
      <div style={styles.container}>
        <div style={styles.card}>
          <h1 style={styles.title}>AICU Japan</h1>
          <p style={styles.text}>無効なリンクです。</p>
          <p style={styles.subtext}>
            メール内の配信停止リンクからアクセスしてください。
          </p>
        </div>
      </div>
    )
  }

  if (status === "success") {
    return (
      <div style={styles.container}>
        <div style={styles.card}>
          <h1 style={styles.title}>AICU Japan</h1>
          <div style={styles.checkmark}>&#10003;</div>
          <p style={styles.text}>配信を停止しました</p>
          <p style={styles.subtext}>
            {email} への配信を停止しました。
            <br />
            再開をご希望の場合はお問い合わせください。
          </p>
        </div>
      </div>
    )
  }

  return (
    <div style={styles.container}>
      <div style={styles.card}>
        <h1 style={styles.title}>AICU Japan</h1>
        <h2 style={styles.heading}>メール配信の停止</h2>
        <p style={styles.text}>
          以下のメールアドレスへの配信を停止しますか？
        </p>
        <p style={styles.email}>{email}</p>

        {status === "error" && (
          <p style={styles.error}>{errorMsg}</p>
        )}

        <button
          onClick={handleUnsubscribe}
          disabled={status === "loading"}
          style={{
            ...styles.button,
            opacity: status === "loading" ? 0.6 : 1,
          }}
        >
          {status === "loading" ? "処理中..." : "配信を停止する"}
        </button>

        <p style={styles.subtext}>
          AICU Japan 株式会社からのメール配信を停止します。
        </p>
      </div>
    </div>
  )
}

const styles: Record<string, React.CSSProperties> = {
  container: {
    minHeight: "100vh",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    background: "#f5f5f5",
    padding: "20px",
  },
  card: {
    background: "#fff",
    borderRadius: "12px",
    padding: "40px",
    maxWidth: "480px",
    width: "100%",
    textAlign: "center",
    boxShadow: "0 2px 12px rgba(0,0,0,0.08)",
  },
  title: {
    fontSize: "14px",
    fontWeight: 600,
    color: "#999",
    letterSpacing: "0.1em",
    marginBottom: "24px",
  },
  heading: {
    fontSize: "20px",
    fontWeight: 600,
    color: "#333",
    marginBottom: "12px",
  },
  text: {
    fontSize: "15px",
    color: "#555",
    marginBottom: "8px",
    lineHeight: 1.6,
  },
  email: {
    fontSize: "16px",
    fontWeight: 600,
    color: "#333",
    padding: "12px 16px",
    background: "#f8f8f8",
    borderRadius: "8px",
    margin: "16px 0 24px",
    wordBreak: "break-all",
  },
  button: {
    background: "#e74c3c",
    color: "#fff",
    border: "none",
    borderRadius: "8px",
    padding: "12px 32px",
    fontSize: "15px",
    fontWeight: 600,
    cursor: "pointer",
    marginBottom: "16px",
  },
  subtext: {
    fontSize: "13px",
    color: "#999",
    lineHeight: 1.5,
  },
  checkmark: {
    fontSize: "48px",
    color: "#27ae60",
    marginBottom: "16px",
  },
  error: {
    color: "#e74c3c",
    fontSize: "14px",
    marginBottom: "16px",
  },
}
