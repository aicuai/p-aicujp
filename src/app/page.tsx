import { getUser, signInWithEmail } from "@/lib/auth"
import { redirect } from "next/navigation"
import LoginForm from "./LoginForm"

export default async function Home() {
  const user = await getUser()
  if (user) redirect("/dashboard")

  return (
    <main style={{ minHeight: "100vh", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: "32px 16px" }}>
      <div style={{ maxWidth: 480, width: "100%" }}>
        {/* Logo */}
        <div className="animate-in" style={{ textAlign: "center", marginBottom: 24 }}>
          <div style={{ display: "inline-flex", alignItems: "center", gap: 10, marginBottom: 8 }}>
            <div style={{
              width: 48,
              height: 48,
              borderRadius: 14,
              background: "linear-gradient(135deg, var(--aicu-teal), var(--aicu-teal-dark))",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              boxShadow: "0 4px 12px rgba(65, 201, 180, 0.25)",
            }}>
              <span className="font-outfit" style={{ color: "#fff", fontWeight: 800, fontSize: 24 }}>A</span>
            </div>
          </div>
          <h1 style={{ margin: 0 }}>
            <span className="font-outfit" style={{ fontSize: 32, fontWeight: 800, color: "var(--text-primary)", letterSpacing: "-0.02em" }}>
              AICU.jp
            </span>{" "}
            <span className="font-outfit" style={{ fontSize: 32, fontWeight: 600, color: "var(--aicu-teal)" }}>
              Portal
            </span>
          </h1>
          <p style={{ marginTop: 8, fontSize: 16, color: "var(--text-secondary)" }}>
            Point &middot; Profile &middot; Privacy
          </p>
        </div>

        {/* R2602 Survey Banner */}
        <a href="/R2602" className="card animate-in-delay" style={{
          display: "block", textDecoration: "none", marginBottom: 24, overflow: "hidden",
          background: "linear-gradient(135deg, rgba(0,49,216,0.04), rgba(65,201,180,0.06))",
          border: "1px solid rgba(0,49,216,0.12)",
        }}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="/images/r2602-banner.png"
            alt="生成AI時代のつくる人調査 2026.02"
            style={{ width: "100%", height: "auto", display: "block" }}
          />
          <div style={{ padding: "16px 20px" }}>
            <h2 style={{ fontSize: 18, fontWeight: 700, color: "var(--text-primary)", lineHeight: 1.5, margin: "0 0 8px" }}>
              生成AI時代の&quot;つくる人&quot;調査 2026.02
            </h2>
            <p style={{ fontSize: 15, color: "var(--text-secondary)", lineHeight: 1.7, margin: "0 0 10px" }}>
              あなたの創造が、AIと社会をつなぐデータになる。<br />
              所要時間：約5分 / 匿名回答 / <strong>10,000 AICUポイント贈呈</strong>
            </p>
            <div style={{ fontSize: 13, color: "var(--text-tertiary)", lineHeight: 1.8 }}>
              <span style={{ color: "#0031D8", fontWeight: 600 }}>回答する &rarr;</span>
              {" / "}
              調査協力: 一般財団法人デジタルコンテンツ協会（DCAJ）
            </div>
          </div>
        </a>

        {/* Login Card */}
        <div className="card animate-in-delay" style={{ padding: 28 }}>
          <div style={{ textAlign: "center", marginBottom: 24 }}>
            <h2 style={{ fontSize: 20, fontWeight: 600, color: "var(--text-primary)", margin: 0 }}>
              ログイン
            </h2>
            <p style={{ marginTop: 6, fontSize: 15, color: "var(--text-secondary)" }}>
              メールアドレスでログイン
            </p>
          </div>

          <LoginForm signInAction={signInWithEmail} />

          <p style={{ textAlign: "center", fontSize: 13, color: "var(--text-tertiary)", marginTop: 16 }}>
            パスワード不要 &mdash; メールでログインリンクを送信します
          </p>
        </div>

        {/* Features */}
        <div className="animate-in-delay-2" style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 12, marginTop: 28 }}>
          {[
            { icon: "\uD83C\uDFAF", title: "Point", desc: "ポイント確認" },
            { icon: "\uD83D\uDC64", title: "Profile", desc: "アンケート" },
            { icon: "\u2764\uFE0F", title: "Privacy", desc: "会員情報" },
          ].map((f) => (
            <div
              key={f.title}
              className="card"
              style={{ padding: 16, textAlign: "center" }}
            >
              <div style={{ fontSize: 24, marginBottom: 6 }}>{f.icon}</div>
              <div style={{ fontSize: 14, fontWeight: 600, color: "var(--text-primary)" }}>
                {f.title}
              </div>
              <div style={{ fontSize: 12, color: "var(--text-tertiary)", marginTop: 3 }}>
                {f.desc}
              </div>
            </div>
          ))}
        </div>

        {/* Footer */}
        <footer className="animate-in-delay-3" style={{ textAlign: "center", fontSize: 12, color: "var(--text-tertiary)", marginTop: 36, display: "flex", flexDirection: "column", gap: 8 }}>
          <div style={{ display: "flex", justifyContent: "center", gap: 16, flexWrap: "wrap" }}>
            <a href="https://corp.aicu.ai/ja/privacy" target="_blank" rel="noopener noreferrer" style={{ color: "var(--text-tertiary)", textDecoration: "none" }}>プライバシーポリシー</a>
            <a href="https://www.aicu.blog/terms/plan-free" target="_blank" rel="noopener noreferrer" style={{ color: "var(--text-tertiary)", textDecoration: "none" }}>利用規約</a>
            <a href="https://www.aicu.blog/terms/legal" target="_blank" rel="noopener noreferrer" style={{ color: "var(--text-tertiary)", textDecoration: "none" }}>法的免責事項</a>
          </div>
          <p>&copy; 2026 AICU Japan 株式会社</p>
        </footer>
      </div>
    </main>
  )
}
