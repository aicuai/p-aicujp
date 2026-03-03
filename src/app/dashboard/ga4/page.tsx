import { getUser } from "@/lib/auth"
import { redirect } from "next/navigation"
import { SUPERUSER_EMAILS } from "@/lib/constants"
import {
  isGA4Configured,
  getGA4Overview,
  getGA4DailyTrend,
  getGA4TopPages,
  getGA4TrafficSources,
  getGA4DataStreams,
  type GA4Overview,
  type GA4DailyData,
  type GA4PageData,
  type GA4SourceData,
  type GA4StreamData,
} from "@/lib/ga4"
import Link from "next/link"
import GA4TrendChart from "@/components/charts/GA4TrendChart"

export default async function GA4Dashboard() {
  const user = await getUser()
  if (!user?.email || !SUPERUSER_EMAILS.includes(user.email)) {
    redirect("/dashboard")
  }

  if (!isGA4Configured()) {
    return (
      <main style={{ minHeight: "100vh", display: "flex", flexDirection: "column" }}>
        <Header />
        <div style={{ flex: 1, width: "100%", maxWidth: 640, margin: "0 auto", padding: "16px" }}>
          <div className="card animate-in" style={{ padding: 24, textAlign: "center" }}>
            <p style={{ fontSize: 15, fontWeight: 600, color: "var(--text-primary)", marginBottom: 8 }}>GA4 未設定</p>
            <p style={{ fontSize: 13, color: "var(--text-secondary)", lineHeight: 1.6 }}>
              環境変数 <code style={{ fontSize: 12, background: "var(--border)", padding: "2px 6px", borderRadius: 4 }}>GA4_CREDENTIALS_BASE64</code> と{" "}
              <code style={{ fontSize: 12, background: "var(--border)", padding: "2px 6px", borderRadius: 4 }}>GA4_PROPERTY_ID</code> を設定してください。
            </p>
            <p style={{ fontSize: 12, color: "var(--text-tertiary)", marginTop: 8 }}>
              詳細は docs/ga4-setup.md を参照
            </p>
          </div>
        </div>
      </main>
    )
  }

  // Parallel fetch all GA4 data
  let overview: GA4Overview | null = null
  let dailyTrend: GA4DailyData[] = []
  let topPages: GA4PageData[] = []
  let trafficSources: GA4SourceData[] = []
  let dataStreams: GA4StreamData[] = []
  let error: string | null = null

  try {
    ;[overview, dailyTrend, topPages, trafficSources, dataStreams] = await Promise.all([
      getGA4Overview(),
      getGA4DailyTrend(30),
      getGA4TopPages(30, 20),
      getGA4TrafficSources(30, 15),
      getGA4DataStreams(30),
    ])
  } catch (e) {
    console.error("[ga4] fetch error:", e)
    error = e instanceof Error ? e.message : String(e)
  }

  const fmt = (n: number) => n.toLocaleString()
  const fmtDuration = (seconds: number) => {
    const m = Math.floor(seconds / 60)
    const s = seconds % 60
    return m > 0 ? `${m}分${s}秒` : `${s}秒`
  }

  return (
    <main style={{ minHeight: "100vh", display: "flex", flexDirection: "column" }}>
      <Header />

      <div style={{ flex: 1, width: "100%", maxWidth: 640, margin: "0 auto", padding: "16px" }}>
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>

          {error && (
            <div className="card" style={{ padding: 16, borderLeft: "3px solid #ef4444" }}>
              <p style={{ fontSize: 13, color: "#ef4444", fontWeight: 600 }}>GA4 API エラー</p>
              <p style={{ fontSize: 12, color: "var(--text-secondary)", marginTop: 4 }}>{error}</p>
            </div>
          )}

          {/* Overview KPI */}
          {overview && (
            <div className="card animate-in" style={{ padding: 20 }}>
              <h2 style={{ fontSize: 15, fontWeight: 600, color: "var(--text-primary)", marginBottom: 16 }}>
                アクセス概要
              </h2>

              {/* 7-day vs 30-day comparison */}
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                <div>
                  <p style={{ fontSize: 11, color: "var(--text-tertiary)", marginBottom: 8, fontWeight: 600 }}>直近7日</p>
                  <MetricRow label="ユーザー" value={fmt(overview.users7d)} highlight />
                  <MetricRow label="セッション" value={fmt(overview.sessions7d)} />
                  <MetricRow label="PV" value={fmt(overview.pageviews7d)} />
                  <MetricRow label="直帰率" value={`${overview.bounceRate7d}%`} />
                  <MetricRow label="平均時間" value={fmtDuration(overview.avgSessionDuration7d)} />
                </div>
                <div>
                  <p style={{ fontSize: 11, color: "var(--text-tertiary)", marginBottom: 8, fontWeight: 600 }}>直近30日</p>
                  <MetricRow label="ユーザー" value={fmt(overview.users30d)} highlight />
                  <MetricRow label="セッション" value={fmt(overview.sessions30d)} />
                  <MetricRow label="PV" value={fmt(overview.pageviews30d)} />
                  <MetricRow label="直帰率" value={`${overview.bounceRate30d}%`} />
                  <MetricRow label="平均時間" value={fmtDuration(overview.avgSessionDuration30d)} />
                </div>
              </div>
            </div>
          )}

          {/* Daily Trend Chart */}
          {dailyTrend.length > 0 && (
            <div className="card animate-in" style={{ padding: 20 }}>
              <h2 style={{ fontSize: 15, fontWeight: 600, color: "var(--text-primary)", marginBottom: 4 }}>
                日別トレンド（30日）
              </h2>
              <p style={{ fontSize: 11, color: "var(--text-tertiary)", marginBottom: 12 }}>
                <span style={{ color: "#41C9B4" }}>&#9632;</span> ユーザー &nbsp;
                <span style={{ color: "rgba(0, 49, 216, 0.5)" }}>&#9632;</span> PV
              </p>
              <GA4TrendChart data={dailyTrend} />
            </div>
          )}

          {/* Top Pages */}
          {topPages.length > 0 && (
            <div className="card animate-in" style={{ padding: 20 }}>
              <h2 style={{ fontSize: 15, fontWeight: 600, color: "var(--text-primary)", marginBottom: 12 }}>
                人気ページ TOP {topPages.length}
              </h2>
              <div style={{ overflowX: "auto" }}>
                <table style={{ width: "100%", fontSize: 12, borderCollapse: "collapse" }}>
                  <thead>
                    <tr style={{ borderBottom: "1px solid var(--border)" }}>
                      <th style={{ textAlign: "left", padding: "6px 4px", color: "var(--text-tertiary)", fontWeight: 500 }}>#</th>
                      <th style={{ textAlign: "left", padding: "6px 4px", color: "var(--text-tertiary)", fontWeight: 500 }}>ページ</th>
                      <th style={{ textAlign: "right", padding: "6px 4px", color: "var(--text-tertiary)", fontWeight: 500 }}>PV</th>
                      <th style={{ textAlign: "right", padding: "6px 4px", color: "var(--text-tertiary)", fontWeight: 500 }}>Users</th>
                    </tr>
                  </thead>
                  <tbody>
                    {topPages.map((page, i) => (
                      <tr key={page.hostname + page.path + i} style={{ borderBottom: "1px solid var(--border)" }}>
                        <td style={{ padding: "6px 4px", color: "var(--text-tertiary)" }}>{i + 1}</td>
                        <td style={{ padding: "6px 4px", color: "var(--text-primary)", maxWidth: 320, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                          <span style={{ fontSize: 10, color: "var(--text-tertiary)", marginRight: 4 }}>{page.hostname}</span>
                          <span title={page.title}>{page.path}</span>
                        </td>
                        <td style={{ padding: "6px 4px", textAlign: "right", fontWeight: 600, color: "var(--aicu-teal)" }}>{fmt(page.pageviews)}</td>
                        <td style={{ padding: "6px 4px", textAlign: "right", color: "var(--text-secondary)" }}>{fmt(page.users)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Traffic Sources */}
          {trafficSources.length > 0 && (
            <div className="card animate-in" style={{ padding: 20 }}>
              <h2 style={{ fontSize: 15, fontWeight: 600, color: "var(--text-primary)", marginBottom: 12 }}>
                流入元（30日）
              </h2>
              <div style={{ overflowX: "auto" }}>
                <table style={{ width: "100%", fontSize: 12, borderCollapse: "collapse" }}>
                  <thead>
                    <tr style={{ borderBottom: "1px solid var(--border)" }}>
                      <th style={{ textAlign: "left", padding: "6px 4px", color: "var(--text-tertiary)", fontWeight: 500 }}>ソース / メディア</th>
                      <th style={{ textAlign: "right", padding: "6px 4px", color: "var(--text-tertiary)", fontWeight: 500 }}>Sessions</th>
                      <th style={{ textAlign: "right", padding: "6px 4px", color: "var(--text-tertiary)", fontWeight: 500 }}>Users</th>
                    </tr>
                  </thead>
                  <tbody>
                    {trafficSources.map((src, i) => (
                      <tr key={src.source + src.medium + i} style={{ borderBottom: "1px solid var(--border)" }}>
                        <td style={{ padding: "6px 4px", color: "var(--text-primary)" }}>
                          {src.source} / <span style={{ color: "var(--text-tertiary)" }}>{src.medium}</span>
                        </td>
                        <td style={{ padding: "6px 4px", textAlign: "right", fontWeight: 600, color: "var(--aicu-teal)" }}>{fmt(src.sessions)}</td>
                        <td style={{ padding: "6px 4px", textAlign: "right", color: "var(--text-secondary)" }}>{fmt(src.users)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Data Streams */}
          {dataStreams.length > 0 && (
            <div className="card animate-in" style={{ padding: 20 }}>
              <h2 style={{ fontSize: 15, fontWeight: 600, color: "var(--text-primary)", marginBottom: 12 }}>
                データストリーム別（30日）
              </h2>
              <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                {dataStreams.map((stream) => {
                  const totalSessions = dataStreams.reduce((s, d) => s + d.sessions, 0)
                  const pct = totalSessions > 0 ? Math.round((stream.sessions / totalSessions) * 100) : 0
                  return (
                    <div key={stream.streamId}>
                      <div style={{ display: "flex", justifyContent: "space-between", fontSize: 12, marginBottom: 2 }}>
                        <span>
                          <span style={{ color: "var(--text-primary)", fontWeight: 500 }}>{stream.url || stream.streamName}</span>
                          {stream.url && stream.streamName && (
                            <span style={{ color: "var(--text-tertiary)", fontSize: 10, marginLeft: 4 }}>({stream.streamName})</span>
                          )}
                        </span>
                        <span style={{ fontWeight: 600, color: "var(--aicu-teal)" }}>
                          {fmt(stream.sessions)} ({pct}%)
                        </span>
                      </div>
                      <div style={{ height: 14, borderRadius: 4, background: "var(--border)", overflow: "hidden" }}>
                        <div style={{
                          width: `${pct}%`,
                          height: "100%",
                          background: "rgba(65, 201, 180, 0.3)",
                          borderRadius: 4,
                          display: "flex",
                          alignItems: "center",
                          paddingLeft: 4,
                        }}>
                          {pct >= 10 && <span style={{ fontSize: 9, color: "var(--aicu-teal)", fontWeight: 600 }}>{fmt(stream.users)} users</span>}
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>
              <p style={{ fontSize: 11, color: "var(--text-tertiary)", marginTop: 8 }}>
                ユーザー合計: {fmt(dataStreams.reduce((s, d) => s + d.users, 0))}
              </p>
            </div>
          )}

        </div>
      </div>

      <footer style={{ textAlign: "center", padding: "24px 16px", fontSize: 11, color: "var(--text-tertiary)" }}>
        <p>&copy; 2026 AICU Japan 株式会社</p>
      </footer>
    </main>
  )
}

function Header() {
  return (
    <header className="glass-nav" style={{ position: "sticky", top: 0, zIndex: 40 }}>
      <div style={{ maxWidth: 640, margin: "0 auto", padding: "12px 16px", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <span className="font-outfit" style={{ fontSize: 20, fontWeight: 800, color: "var(--aicu-teal)", letterSpacing: "-0.02em" }}>
            AICU
          </span>
          <span style={{ fontSize: 15, fontWeight: 600, color: "var(--text-primary)" }}>
            GA4
          </span>
        </div>
        <div style={{ display: "flex", gap: 12 }}>
          <Link href="/dashboard/admin" style={{ fontSize: 13, color: "var(--aicu-teal)", textDecoration: "none", fontWeight: 500 }}>
            Admin
          </Link>
          <Link href="/dashboard" style={{ fontSize: 13, color: "var(--text-secondary)", textDecoration: "none", fontWeight: 500 }}>
            Dashboard
          </Link>
        </div>
      </div>
    </header>
  )
}

function MetricRow({ label, value, highlight }: { label: string; value: string; highlight?: boolean }) {
  return (
    <div style={{ display: "flex", justifyContent: "space-between", fontSize: 13, padding: "3px 0" }}>
      <span style={{ color: "var(--text-secondary)" }}>{label}</span>
      <span style={{ color: highlight ? "var(--aicu-teal)" : "var(--text-primary)", fontWeight: highlight ? 600 : 400 }}>{value}</span>
    </div>
  )
}
