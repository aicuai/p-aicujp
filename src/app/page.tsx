import { getUser, signInWithEmail } from "@/lib/auth"
import { redirect } from "next/navigation"
import LoginForm from "./LoginForm"

export default async function Home() {
  const user = await getUser()
  if (user) redirect("/dashboard")

  return (
    <div style={{ minHeight: "100vh" }}>
      {/* Sticky Header — matches aicu.jp */}
      <header className="glass-nav" style={{
        position: "sticky",
        top: 0,
        zIndex: 50,
      }}>
        <div style={{
          maxWidth: 640,
          margin: "0 auto",
          padding: "14px 16px",
          display: "flex",
          alignItems: "center",
          gap: 10,
        }}>
          <span className="font-outfit" style={{
            fontSize: 22,
            fontWeight: 800,
            color: "var(--aicu-teal)",
            letterSpacing: "-0.02em",
          }}>
            AICU Japan
          </span>
          <span style={{
            fontSize: 10,
            color: "var(--text-tertiary)",
            lineHeight: 1.3,
            marginLeft: 2,
          }}>
            クリエイティブAI時代に<br />つくる人をつくる
          </span>
        </div>
      </header>

      <main style={{
        maxWidth: 640,
        margin: "0 auto",
        padding: 16,
      }}>
        {/* Hero Banner — R2602 Survey */}
        <a href="/R2602" className="animate-in" style={{ display: "block", marginBottom: 16, textDecoration: "none" }}>
          <div style={{
            position: "relative",
            borderRadius: "var(--radius)",
            overflow: "hidden",
          }}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src="/images/r2602-banner.png"
              alt="生成AI時代の「つくる人」調査 R2602"
              width={640}
              height={357}
              style={{
                width: "100%",
                height: "auto",
                display: "block",
                borderRadius: "var(--radius)",
              }}
            />
            <div style={{
              position: "absolute",
              bottom: 0,
              left: 0,
              right: 0,
              padding: "24px 14px 10px",
              background: "linear-gradient(transparent, rgba(0,0,0,0.7))",
              borderRadius: "0 0 var(--radius) var(--radius)",
            }}>
              <div style={{
                display: "inline-block",
                padding: "3px 10px",
                borderRadius: 12,
                background: "linear-gradient(135deg, #41C9B4, #6C63FF)",
                color: "#fff",
                fontSize: 10,
                fontWeight: 700,
                marginBottom: 4,
              }}>
                AICU Research
              </div>
              <div style={{ fontSize: 14, fontWeight: 700, color: "#fff" }}>
                生成AI「つくる人」調査 R2602
              </div>
              <div style={{ fontSize: 11, color: "rgba(255,255,255,0.8)" }}>
                あなたの声が、AIクリエイターの未来を形づくる
              </div>
            </div>
          </div>
        </a>

        {/* 2x2 Main Cards */}
        <div className="animate-in-delay" style={{
          display: "grid",
          gridTemplateColumns: "repeat(2, 1fr)",
          gap: 10,
          marginBottom: 20,
        }}>
          {mainCards.map((card) => (
            <a
              key={card.name}
              href={card.url}
              style={{
                display: "flex",
                flexDirection: "column",
                gap: 6,
                padding: "18px 14px",
                borderRadius: "var(--radius)",
                background: "linear-gradient(135deg, var(--aicu-teal-light), var(--bg-card))",
                border: "1px solid var(--aicu-teal)",
                textDecoration: "none",
                boxShadow: "var(--shadow-sm)",
                transition: "transform 0.15s",
              }}
            >
              <span style={{ fontSize: 28 }}>{card.icon}</span>
              <span className="font-outfit" style={{
                fontSize: 14,
                fontWeight: 700,
                color: "var(--aicu-teal-dark)",
              }}>
                {card.name}
              </span>
              <span style={{
                fontSize: 11,
                color: "var(--text-secondary)",
                lineHeight: 1.4,
              }}>
                {card.label}
              </span>
            </a>
          ))}
        </div>

        {/* Login Card */}
        <div className="card animate-in-delay" style={{ padding: 24, marginBottom: 20 }}>
          <div style={{ textAlign: "center", marginBottom: 16 }}>
            <h2 style={{ fontSize: 18, fontWeight: 600, color: "var(--text-primary)", margin: 0 }}>
              ログイン
            </h2>
            <p style={{ marginTop: 4, fontSize: 13, color: "var(--text-secondary)" }}>
              メールアドレスでログイン &mdash; パスワード不要
            </p>
          </div>
          <LoginForm signInAction={signInWithEmail} />
        </div>

        {/* 3-column Service Grid */}
        <div className="animate-in-delay-2" style={{
          display: "grid",
          gridTemplateColumns: "repeat(3, 1fr)",
          gap: 10,
          marginBottom: 20,
        }}>
          {serviceLinks.map((s) => (
            <a
              key={s.label}
              href={s.url}
              target="_blank"
              rel="noopener noreferrer"
              style={{
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                gap: 8,
                padding: "16px 8px",
                borderRadius: 14,
                background: "var(--bg-card)",
                textDecoration: "none",
                boxShadow: "0 1px 6px rgba(0,0,0,0.04)",
                transition: "transform 0.15s",
              }}
            >
              <span style={{ fontSize: 28 }}>{s.icon}</span>
              <span style={{
                fontSize: 11,
                fontWeight: 600,
                color: "var(--text-secondary)",
                textAlign: "center",
                lineHeight: 1.3,
              }}>
                {s.label}
              </span>
            </a>
          ))}
        </div>

        {/* Footer */}
        <footer className="animate-in-delay-3" style={{
          padding: "28px 0 16px",
          textAlign: "center",
          fontSize: 11,
          color: "var(--text-tertiary)",
        }}>
          <div style={{
            display: "flex",
            flexWrap: "wrap",
            justifyContent: "center",
            gap: "4px 14px",
            marginBottom: 14,
          }}>
            {footerLinks.map((f) => (
              <a
                key={f.label}
                href={f.url}
                target="_blank"
                rel="noopener noreferrer"
                style={{ color: "var(--text-tertiary)", textDecoration: "none" }}
              >
                {f.label}
              </a>
            ))}
          </div>
          <p>Powered by <a href="https://aicu.ai" target="_blank" rel="noopener" style={{ color: "var(--aicu-teal)", textDecoration: "none" }}>AICU Inc.</a></p>
        </footer>
      </main>
    </div>
  )
}

const mainCards = [
  { icon: "\uD83D\uDCCB", name: "\u30A2\u30F3\u30B1\u30FC\u30C8\u53C2\u52A0", label: "R2602 \u3064\u304F\u308B\u4EBA\u8ABF\u67FB\u306B\u56DE\u7B54", url: "/R2602" },
  { icon: "\uD83D\uDCCA", name: "\u7D50\u679C\u901F\u5831", label: "\u30EA\u30A2\u30EB\u30BF\u30A4\u30E0\u96C6\u8A08\u7D50\u679C", url: "/q/R2602/results" },
  { icon: "\uD83C\uDFAF", name: "\u30DD\u30A4\u30F3\u30C8", label: "AICU\u30DD\u30A4\u30F3\u30C8\u6B8B\u9AD8\u30FB\u5C65\u6B74", url: "/dashboard" },
  { icon: "\uD83D\uDC64", name: "\u30D7\u30ED\u30D5\u30A3\u30FC\u30EB", label: "\u4F1A\u54E1\u60C5\u5831\u30FB\u30B5\u30D6\u30B9\u30AF\u7BA1\u7406", url: "/dashboard" },
]

const serviceLinks = [
  { icon: "\uD83C\uDFE0", label: "aicu.jp", url: "https://aicu.jp" },
  { icon: "\uD83D\uDCC8", label: "u.aicu.jp", url: "https://u.aicu.jp" },
  { icon: "\uD83C\uDFC6", label: "\u30B3\u30F3\u30C6\u30B9\u30C8", url: "https://c.aicu.jp" },
]

const footerLinks = [
  { label: "\u5229\u7528\u898F\u7D04", url: "https://www.aicu.blog/terms/plan-free" },
  { label: "\u30D7\u30E9\u30A4\u30D0\u30B7\u30FC", url: "https://corp.aicu.ai/ja/privacy" },
  { label: "\u6CD5\u7684\u514D\u8CAC", url: "https://www.aicu.blog/terms/legal" },
  { label: "\u7279\u5B9A\u5546\u53D6\u5F15\u6CD5", url: "https://www.aicu.blog/commercial-act" },
  { label: "\u304A\u554F\u3044\u5408\u308F\u305B", url: "https://www.aicu.blog/contact" },
]
