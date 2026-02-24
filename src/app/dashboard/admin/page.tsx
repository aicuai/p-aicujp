import { getUser } from "@/lib/auth"
import { redirect } from "next/navigation"
import { SUPERUSER_EMAILS } from "@/lib/constants"
import { getAdminSupabase } from "@/lib/supabase"
import { getTotalContactsCount, getTotalMembersCount, getSubscriptionStats } from "@/lib/wix"
import Link from "next/link"
import SurveyProgressChart from "@/components/charts/SurveyProgressChart"
import SurveyComparisonChart from "@/components/charts/SurveyComparisonChart"
import WixEmailExport from "@/components/WixEmailExport"
import RetryRewardsButton from "@/components/RetryRewardsButton"

export default async function AdminDashboard() {
  const user = await getUser()
  if (!user?.email || !SUPERUSER_EMAILS.includes(user.email)) {
    redirect("/dashboard")
  }

  const admin = getAdminSupabase()

  // Parallel queries
  const [
    unifiedResult,
    wixLinkedResult,
    discordLinkedResult,
    login7dResult,
    login30dResult,
    newUsers7dResult,
    authUsersResult,
    profilesResult,
    pushSubsResult,
    recentLoginsResult,
    surveyCountResult,
    surveyLatestResult,
    surveyAllTimestampsResult,
    loyaltyCacheResult,
    rewardConfirmedResult,
    rewardPendingResult,
    rewardFailedResult,
    rewardNoneResult,
    rewardWithEmailResult,
    funnelResult,
    failedRewardsResult,
    newestUsersResult,
    r2602CountResult,
    r2511CountResult,
  ] = await Promise.all([
    admin.from("unified_users").select("id", { count: "exact", head: true }),
    admin.from("unified_users").select("id", { count: "exact", head: true }).not("wix_contact_id", "is", null),
    admin.from("unified_users").select("id", { count: "exact", head: true }).not("discord_id", "is", null),
    admin.from("unified_users").select("id", { count: "exact", head: true }).gte("last_login_at", new Date(Date.now() - 7 * 86400000).toISOString()),
    admin.from("unified_users").select("id", { count: "exact", head: true }).gte("last_login_at", new Date(Date.now() - 30 * 86400000).toISOString()),
    admin.from("unified_users").select("id", { count: "exact", head: true }).gte("created_at", new Date(Date.now() - 7 * 86400000).toISOString()),
    admin.auth.admin.listUsers({ page: 1, perPage: 1 }),
    admin.from("profiles").select("id", { count: "exact", head: true }),
    admin.from("push_subscriptions").select("user_id", { count: "exact", head: true }),
    admin.from("unified_users").select("primary_email, last_login_at, wix_contact_id, discord_id").order("last_login_at", { ascending: false, nullsFirst: false }).limit(10),
    admin.from("survey_responses").select("id", { count: "exact", head: true }).neq("is_test", true),
    admin.from("survey_responses").select("survey_id, email, submitted_at, reward_status").neq("is_test", true).order("submitted_at", { ascending: false }).limit(10),
    admin.from("survey_responses").select("survey_id, submitted_at").neq("is_test", true).order("submitted_at", { ascending: true }),
    // Loyalty cache
    admin.from("admin_cache").select("data, updated_at").eq("key", "loyalty-summary").single(),
    // Reward status counts (excluding test data)
    admin.from("survey_responses").select("id", { count: "exact", head: true }).neq("is_test", true).eq("reward_status", "confirmed"),
    admin.from("survey_responses").select("id", { count: "exact", head: true }).neq("is_test", true).eq("reward_status", "pending"),
    admin.from("survey_responses").select("id", { count: "exact", head: true }).neq("is_test", true).eq("reward_status", "failed"),
    admin.from("survey_responses").select("id", { count: "exact", head: true }).neq("is_test", true).eq("reward_status", "none"),
    admin.from("survey_responses").select("id", { count: "exact", head: true }).neq("is_test", true).not("email", "is", null),
    // Funnel/progress beacons
    admin.from("survey_kv").select("value").eq("survey_id", "R2602").eq("key", "progress"),
    // Failed rewards
    admin.from("survey_responses").select("id, survey_id, email, submitted_at, reward_status").neq("is_test", true).eq("reward_status", "failed").order("submitted_at", { ascending: false }),
    // Newest users for Task 3
    admin.from("unified_users").select("primary_email, created_at, wix_contact_id, wix_member_id").order("created_at", { ascending: false }).limit(5),
    // R2602-specific counts
    admin.from("survey_responses").select("id", { count: "exact", head: true }).neq("is_test", true).eq("survey_id", "R2602"),
    admin.from("survey_responses").select("id", { count: "exact", head: true }).neq("is_test", true).eq("survey_id", "R2511"),
  ])

  const totalUsers = unifiedResult.count ?? 0
  const wixLinked = wixLinkedResult.count ?? 0
  const discordLinked = discordLinkedResult.count ?? 0
  const login7d = login7dResult.count ?? 0
  const login30d = login30dResult.count ?? 0
  const newUsers7d = newUsers7dResult.count ?? 0
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const authUsersTotal = (authUsersResult as any)?.data?.total ?? totalUsers
  const profilesCount = profilesResult.count ?? 0
  const pushSubsCount = pushSubsResult.count ?? 0

  let wixTotalContacts = 0
  let wixTotalMembers = 0
  let subscriptionStats: { total: number; byPlanAndStatus: Record<string, Record<string, number>> } = { total: 0, byPlanAndStatus: {} }
  try {
    ;[wixTotalContacts, wixTotalMembers, subscriptionStats] = await Promise.all([
      getTotalContactsCount(),
      getTotalMembersCount(),
      getSubscriptionStats(),
    ])
  } catch (e) {
    console.error("[admin] Wix count error:", e)
  }

  const safeRate = (n: number, d: number) => d > 0 ? Math.round((n / d) * 1000) / 10 : 0
  const wixRate = safeRate(wixLinked, totalUsers)
  const discordRate = safeRate(discordLinked, totalUsers)
  const profileRate = safeRate(profilesCount, authUsersTotal)
  const pushRate = safeRate(pushSubsCount, authUsersTotal)
  const wauMauRatio = safeRate(login7d, login30d)

  // Subscription tier counts (active only)
  const tierFree = Object.entries(subscriptionStats.byPlanAndStatus)
    .filter(([name]) => name.includes("Free") || name.includes("無料"))
    .reduce((sum, [, s]) => sum + (s["ACTIVE"] || 0), 0)
  const tierBasic = Object.entries(subscriptionStats.byPlanAndStatus)
    .filter(([name]) => name.includes("Basic") || name.includes("基本"))
    .reduce((sum, [, s]) => sum + (s["ACTIVE"] || 0), 0)
  const tierLabPlus = Object.entries(subscriptionStats.byPlanAndStatus)
    .filter(([name]) => name.includes("Lab+"))
    .reduce((sum, [, s]) => sum + (s["ACTIVE"] || 0), 0)

  const recentLogins = recentLoginsResult.data ?? []
  const surveyCount = surveyCountResult.count ?? 0
  const surveyLatest = (surveyLatestResult.data ?? []) as { survey_id: string; email: string | null; submitted_at: string; reward_status: string | null }[]

  // Reward stats
  const rewardConfirmed = rewardConfirmedResult.count ?? 0
  const rewardPending = rewardPendingResult.count ?? 0
  const rewardFailed = rewardFailedResult.count ?? 0
  const rewardNone = rewardNoneResult.count ?? 0
  const rewardWithEmail = rewardWithEmailResult.count ?? 0
  const rewardRate = safeRate(rewardConfirmed, rewardWithEmail)

  // Email registration & cost metrics
  const emailRegistrationRate = safeRate(rewardWithEmail, surveyCount)
  const POINTS_PER_RESPONSE = 10000
  const YEN_PER_POINT = 0.1 // 10000pt = 1000円
  const costPerEmail = rewardWithEmail > 0 ? Math.round(rewardWithEmail * POINTS_PER_RESPONSE * YEN_PER_POINT) : 0
  const costPerEmailUnit = rewardWithEmail > 0 ? Math.round(POINTS_PER_RESPONSE * YEN_PER_POINT) : 0
  const costPerResponse = surveyCount > 0 ? Math.round((rewardWithEmail * POINTS_PER_RESPONSE * YEN_PER_POINT) / surveyCount) : 0

  // Loyalty cache
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const loyaltyCache = (loyaltyCacheResult as any)?.data as { data: { totalAccounts: number; totalEarned: number; totalRedeemed: number; consumptionRate: number }; updated_at: string } | null

  // Build funnel data from progress beacons
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const funnelRows = (funnelResult?.data ?? []) as { value: { step: number; answeredCount: number; totalQuestions: number } }[]
  // step=-1: LP/gate view, step=0: gate passed, step=1+: survey questions
  const funnelSteps = [
    { label: "LP到達", minStep: -1 },
    { label: "ゲート通過", minStep: 0 },
    { label: "基本情報", minStep: 2 },
    { label: "AI活動", minStep: 6 },
    { label: "学習・環境", minStep: 12 },
    { label: "効果", minStep: 17 },
    { label: "態度・DCAJ", minStep: 19 },
    { label: "証明・権利", minStep: 29 },
    { label: "VoC・メール", minStep: 35 },
  ]
  const funnelTotal = funnelRows.length
  const funnelBySection = funnelSteps.map((sec) => {
    const reached = funnelRows.filter(r => r.value.step >= sec.minStep).length
    return { ...sec, reached }
  })

  // Build daily counts for progress chart (all surveys combined + per-survey)
  const surveyTimestamps = (surveyAllTimestampsResult.data ?? []) as { survey_id: string; submitted_at: string }[]
  const dailyMap: Record<string, number> = {}
  const dailyMapBySurvey: Record<string, Record<string, number>> = {}
  for (const row of surveyTimestamps) {
    if (!row.submitted_at) continue
    const date = row.submitted_at.slice(0, 10) // "2026-02-01"
    dailyMap[date] = (dailyMap[date] || 0) + 1
    if (!dailyMapBySurvey[row.survey_id]) dailyMapBySurvey[row.survey_id] = {}
    dailyMapBySurvey[row.survey_id][date] = (dailyMapBySurvey[row.survey_id][date] || 0) + 1
  }
  const dailyCounts = Object.entries(dailyMap)
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([date, count]) => ({ date, count }))

  // Build "elapsed days" comparison data for R2511 vs R2602
  const buildElapsedSeries = (surveyId: string) => {
    const map = dailyMapBySurvey[surveyId] ?? {}
    const sorted = Object.entries(map).sort(([a], [b]) => a.localeCompare(b))
    if (sorted.length === 0) return []
    const firstDate = new Date(sorted[0][0])
    let cumulative = 0
    return sorted.map(([date, count]) => {
      cumulative += count
      const elapsed = Math.round((new Date(date).getTime() - firstDate.getTime()) / 86400000)
      return { day: elapsed, daily: count, cumulative, date }
    })
  }
  const r2511Series = buildElapsedSeries("R2511")
  const r2602Series = buildElapsedSeries("R2602")
  const r2511Total = r2511Series.length > 0 ? r2511Series[r2511Series.length - 1].cumulative : 0
  const r2602Total = r2602Series.length > 0 ? r2602Series[r2602Series.length - 1].cumulative : 0
  const r2511Days = r2511Series.length > 0 ? r2511Series[r2511Series.length - 1].day : 0
  const r2602Days = r2602Series.length > 0 ? r2602Series[r2602Series.length - 1].day : 0

  // Failed rewards
  const failedRewards = (failedRewardsResult?.data ?? []) as { id: string; survey_id: string; email: string | null; submitted_at: string; reward_status: string }[]

  // Newest users
  const newestUsers = (newestUsersResult?.data ?? []) as { primary_email: string | null; created_at: string; wix_contact_id: string | null; wix_member_id: string | null }[]

  // Per-survey counts
  const r2602Count = r2602CountResult?.count ?? 0
  const r2511Count = r2511CountResult?.count ?? 0

  return (
    <main style={{ minHeight: "100vh", display: "flex", flexDirection: "column" }}>
      {/* Header */}
      <header className="glass-nav" style={{ position: "sticky", top: 0, zIndex: 40 }}>
        <div style={{ maxWidth: 640, margin: "0 auto", padding: "12px 16px", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <span className="font-outfit" style={{ fontSize: 20, fontWeight: 800, color: "var(--aicu-teal)", letterSpacing: "-0.02em" }}>
              AICU
            </span>
            <span style={{ fontSize: 15, fontWeight: 600, color: "var(--text-primary)" }}>
              Admin
            </span>
          </div>
          <Link href="/dashboard" style={{ fontSize: 13, color: "var(--aicu-teal)", textDecoration: "none", fontWeight: 500 }}>
            &larr; ダッシュボード
          </Link>
        </div>
      </header>

      {/* Content */}
      <div style={{ flex: 1, width: "100%", maxWidth: 640, margin: "0 auto", padding: "16px" }}>
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>

          {/* Member Funnel */}
          <div className="card animate-in" style={{ padding: 20 }}>
            <h2 style={{ fontSize: 15, fontWeight: 600, color: "var(--text-primary)", marginBottom: 16 }}>会員ファネル</h2>
            {(() => {
              const funnelLayers = [
                { label: "Wix 連絡先", count: wixTotalContacts, color: "var(--text-tertiary)", bg: "rgba(0,0,0,0.04)" },
                { label: "Wix サイト会員", count: wixTotalMembers, color: "var(--text-secondary)", bg: "rgba(0,0,0,0.06)" },
                { label: "調査参加者（Free）", count: rewardWithEmail, color: "#0031D8", bg: "rgba(0,49,216,0.08)" },
                { label: "基本会員（Basic）", count: tierBasic, color: "#f59e0b", bg: "rgba(245,158,11,0.1)" },
                { label: "Lab+ 会員", count: tierLabPlus, color: "var(--aicu-teal)", bg: "rgba(65,201,180,0.12)" },
              ]
              return (
                <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                  {funnelLayers.map((layer, i) => {
                    const widthPct = wixTotalContacts > 0 ? Math.max(8, (layer.count / wixTotalContacts) * 100) : 0
                    return (
                      <div key={layer.label}>
                        <div style={{ display: "flex", justifyContent: "space-between", fontSize: 12, marginBottom: 3 }}>
                          <span style={{ color: "var(--text-secondary)" }}>{layer.label}</span>
                          <span style={{ fontWeight: 600, color: layer.color }}>{layer.count}人</span>
                        </div>
                        <div style={{ height: 18, borderRadius: 4, background: "var(--border)", overflow: "hidden", position: "relative" }}>
                          <div style={{
                            width: `${widthPct}%`,
                            height: "100%",
                            background: layer.bg,
                            borderRadius: 4,
                            borderLeft: `3px solid ${layer.color}`,
                            display: "flex",
                            alignItems: "center",
                            paddingLeft: 6,
                            transition: "width 0.5s ease",
                          }}>
                            {widthPct > 15 && (
                              <span style={{ fontSize: 9, color: layer.color, fontWeight: 600 }}>
                                {wixTotalContacts > 0 ? safeRate(layer.count, wixTotalContacts) : 0}%
                              </span>
                            )}
                          </div>
                        </div>
                        {i < funnelLayers.length - 1 && (
                          <div style={{ fontSize: 9, color: "var(--text-tertiary)", textAlign: "right", marginTop: 1 }}>
                            {funnelLayers[i + 1].count > 0 && layer.count > 0 ? `${safeRate(funnelLayers[i + 1].count, layer.count)}% ↓` : ""}
                          </div>
                        )}
                      </div>
                    )
                  })}
                </div>
              )
            })()}
            {/* Active site users */}
            <div style={{ marginTop: 14, paddingTop: 12, borderTop: "1px solid var(--border)" }}>
              <div style={{ fontSize: 12, fontWeight: 600, color: "var(--text-primary)", marginBottom: 8 }}>新サイト アクティブユーザー</div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
                <div style={{ padding: 10, borderRadius: "var(--radius-sm)", background: "rgba(0,0,0,0.02)" }}>
                  <div style={{ fontSize: 11, color: "var(--text-tertiary)", marginBottom: 2 }}>p.aicu.jp 登録者</div>
                  <div style={{ fontSize: 22, fontWeight: 700, color: "var(--text-primary)" }}>{totalUsers}</div>
                  {newUsers7d > 0 && <div style={{ fontSize: 10, color: "var(--aicu-teal)", fontWeight: 600 }}>+{newUsers7d} (7日)</div>}
                </div>
                <div style={{ padding: 10, borderRadius: "var(--radius-sm)", background: "rgba(0,0,0,0.02)" }}>
                  <div style={{ fontSize: 11, color: "var(--text-tertiary)", marginBottom: 2 }}>7日アクティブ</div>
                  <div style={{ fontSize: 22, fontWeight: 700, color: "var(--text-primary)" }}>{login7d}</div>
                  <div style={{ fontSize: 10, color: "var(--text-tertiary)" }}>WAU/MAU {wauMauRatio}%</div>
                </div>
              </div>
              <div style={{ display: "flex", gap: 10, marginTop: 8, fontSize: 11, color: "var(--text-tertiary)" }}>
                <span>Push購読: {pushSubsCount}人 ({pushRate}%)</span>
                <span>Discord: {discordLinked}人 ({discordRate}%)</span>
              </div>
            </div>
          </div>

          {/* Wix Email Export */}
          <div className="card animate-in-delay-2" style={{ padding: 20 }}>
            <h2 style={{ fontSize: 15, fontWeight: 600, color: "var(--text-primary)", marginBottom: 12 }}>メールリスト取得</h2>
            <WixEmailExport />
          </div>

          {/* Survey Responses */}
          <div className="card animate-in-delay-3" style={{ padding: 20 }}>
            <h2 style={{ fontSize: 15, fontWeight: 600, color: "var(--text-primary)", marginBottom: 12 }}>
              調査回答 <span style={{ fontSize: 12, fontWeight: 400, color: "var(--text-tertiary)" }}>（survey_responses）</span>
            </h2>
            <div style={{ display: "flex", justifyContent: "space-between", fontSize: 14, marginBottom: 8 }}>
              <span style={{ color: "var(--text-secondary)" }}>総回答数</span>
              <span style={{ fontWeight: 700, fontSize: 20, color: "var(--text-primary)" }}>{surveyCount}</span>
            </div>
            <div style={{ display: "flex", gap: 12, fontSize: 12, marginBottom: 12 }}>
              <span style={{ color: "var(--text-tertiary)" }}>R2511: <strong style={{ color: "#8884d8" }}>{r2511Count}</strong></span>
              <span style={{ color: "var(--text-tertiary)" }}>R2602: <strong style={{ color: "var(--aicu-teal)" }}>{r2602Count}</strong></span>
            </div>
            {/* Cumulative progress chart */}
            {dailyCounts.length > 0 && (
              <div style={{ marginBottom: 16 }}>
                <div style={{ fontSize: 12, color: "var(--text-tertiary)", marginBottom: 8 }}>回答数推移（累計・全調査合計）</div>
                <SurveyProgressChart dailyCounts={dailyCounts} goals={[100, 200, 300]} />
              </div>
            )}

            {/* R2511 vs R2602 Comparison */}
            {(r2511Series.length > 0 || r2602Series.length > 0) && (
              <div style={{ marginBottom: 16 }}>
                <div style={{ fontSize: 13, fontWeight: 600, color: "var(--text-primary)", marginBottom: 4 }}>
                  R2511 vs R2602 成長比較
                </div>
                <div style={{ fontSize: 11, color: "var(--text-tertiary)", marginBottom: 8 }}>
                  開始日からの経過日数 vs 累計エントリー数
                </div>
                <SurveyComparisonChart r2511={r2511Series} r2602={r2602Series} />
                <div style={{ display: "flex", gap: 16, fontSize: 11, color: "var(--text-tertiary)", marginTop: 6, flexWrap: "wrap" }}>
                  <span style={{ color: "#8884d8" }}>R2511: {r2511Total}件 / {r2511Days}日</span>
                  <span style={{ color: "#41C9B4" }}>R2602: {r2602Total}件 / {r2602Days}日</span>
                  {r2602Days > 0 && r2511Days > 0 && (
                    <span>
                      ペース比: {(r2602Total / r2602Days).toFixed(1)}件/日 vs {(r2511Total / r2511Days).toFixed(1)}件/日
                    </span>
                  )}
                </div>
              </div>
            )}

            {/* Funnel / Drop-off Analysis */}
            {funnelTotal > 0 && (
              <div style={{ marginBottom: 16, padding: 12, background: "rgba(0,0,0,0.02)", borderRadius: "var(--radius-sm)" }}>
                <div style={{ fontSize: 13, fontWeight: 600, color: "var(--text-primary)", marginBottom: 8 }}>
                  離脱ファネル <span style={{ fontSize: 11, fontWeight: 400, color: "var(--text-tertiary)" }}>（{funnelTotal}セッション）</span>
                </div>
                <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
                  {funnelBySection.map((sec, i) => {
                    const pct = funnelTotal > 0 ? Math.round((sec.reached / funnelTotal) * 100) : 0
                    const prevReached = i > 0 ? funnelBySection[i - 1].reached : funnelTotal
                    const dropPct = prevReached > 0 ? Math.round(((prevReached - sec.reached) / prevReached) * 100) : 0
                    return (
                      <div key={sec.label} style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 12 }}>
                        <span style={{ width: 72, color: "var(--text-secondary)", flexShrink: 0, textAlign: "right" }}>{sec.label}</span>
                        <div style={{ flex: 1, height: 14, background: "var(--border)", borderRadius: 3, overflow: "hidden", position: "relative" }}>
                          <div style={{
                            width: `${pct}%`,
                            height: "100%",
                            background: dropPct > 30 ? "#ef4444" : dropPct > 15 ? "#f59e0b" : "var(--aicu-teal)",
                            borderRadius: 3,
                            transition: "width 0.3s",
                          }} />
                        </div>
                        <span style={{ width: 70, fontSize: 11, color: dropPct > 30 ? "#ef4444" : "var(--text-tertiary)", flexShrink: 0 }}>
                          {sec.reached} ({pct}%){dropPct > 0 && i > 0 ? ` -${dropPct}%` : ""}
                        </span>
                      </div>
                    )
                  })}
                </div>
                <div style={{ fontSize: 10, color: "var(--text-tertiary)", marginTop: 6 }}>
                  ※ デプロイ後のデータのみ。赤=30%以上離脱 / 黄=15%以上離脱
                </div>
              </div>
            )}

            {/* Reward Status Summary */}
            <div style={{ marginBottom: 16, padding: 12, background: "rgba(0,0,0,0.02)", borderRadius: "var(--radius-sm)" }}>
              <div style={{ fontSize: 13, fontWeight: 600, color: "var(--text-primary)", marginBottom: 8 }}>
                AICUポイント付与状況 <span style={{ fontSize: 11, fontWeight: 400, color: "var(--text-tertiary)" }}>+10,000pt/件</span>
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 6, fontSize: 12, marginBottom: 8 }}>
                <div style={{ display: "flex", justifyContent: "space-between" }}>
                  <span style={{ color: "var(--text-secondary)" }}>メール提供者</span>
                  <span style={{ fontWeight: 600 }}>{rewardWithEmail}人</span>
                </div>
                <div style={{ display: "flex", justifyContent: "space-between" }}>
                  <span style={{ color: "var(--text-secondary)" }}>匿名回答</span>
                  <span style={{ color: "var(--text-tertiary)" }}>{rewardNone}人</span>
                </div>
                <div style={{ display: "flex", justifyContent: "space-between" }}>
                  <span style={{ color: "var(--aicu-teal)" }}>付与済み</span>
                  <span style={{ fontWeight: 600, color: "var(--aicu-teal)" }}>{rewardConfirmed}</span>
                </div>
                <div style={{ display: "flex", justifyContent: "space-between" }}>
                  <span style={{ color: "#f59e0b" }}>処理中</span>
                  <span style={{ fontWeight: 600, color: "#f59e0b" }}>{rewardPending}</span>
                </div>
                <div style={{ display: "flex", justifyContent: "space-between" }}>
                  <span style={{ color: "#ef4444" }}>失敗</span>
                  <span style={{ fontWeight: 600, color: "#ef4444" }}>{rewardFailed}</span>
                </div>
                <div style={{ display: "flex", justifyContent: "space-between" }}>
                  <span style={{ fontWeight: 600 }}>付与率</span>
                  <span style={{ fontWeight: 700, color: rewardRate >= 100 ? "var(--aicu-teal)" : "#ef4444" }}>{rewardRate}%</span>
                </div>
              </div>
              {/* Reward rate bar */}
              <div style={{ height: 6, borderRadius: 3, background: "var(--border)", overflow: "hidden", display: "flex" }}>
                <div style={{ width: `${rewardRate}%`, background: "var(--aicu-teal)", borderRadius: 3 }} />
                {rewardPending > 0 && (
                  <div style={{ width: `${safeRate(rewardPending, rewardWithEmail)}%`, background: "#f59e0b" }} />
                )}
                {rewardFailed > 0 && (
                  <div style={{ width: `${safeRate(rewardFailed, rewardWithEmail)}%`, background: "#ef4444" }} />
                )}
              </div>

              {/* Email registration & cost metrics */}
              <div style={{ marginTop: 10, paddingTop: 10, borderTop: "1px solid var(--border)", display: "grid", gridTemplateColumns: "1fr 1fr", gap: 6, fontSize: 12 }}>
                <div style={{ display: "flex", justifyContent: "space-between" }}>
                  <span style={{ color: "var(--text-secondary)" }}>メール登録率</span>
                  <span style={{ fontWeight: 700, color: emailRegistrationRate >= 80 ? "var(--aicu-teal)" : "#f59e0b" }}>{emailRegistrationRate}%</span>
                </div>
                <div style={{ display: "flex", justifyContent: "space-between" }}>
                  <span style={{ color: "var(--text-secondary)" }}>1件あたりコスト</span>
                  <span style={{ fontWeight: 600 }}>{costPerResponse.toLocaleString()}円</span>
                </div>
                <div style={{ display: "flex", justifyContent: "space-between" }}>
                  <span style={{ color: "var(--text-secondary)" }}>メール獲得単価</span>
                  <span style={{ fontWeight: 600 }}>{costPerEmailUnit.toLocaleString()}円</span>
                </div>
                <div style={{ display: "flex", justifyContent: "space-between" }}>
                  <span style={{ color: "var(--text-secondary)" }}>総コスト（換算）</span>
                  <span style={{ fontWeight: 600 }}>{costPerEmail.toLocaleString()}円</span>
                </div>
              </div>
              <div style={{ fontSize: 10, color: "var(--text-tertiary)", marginTop: 4 }}>
                ※ 10,000pt = 1,000円換算（メール登録者のみポイント付与）
              </div>

              {/* Failed rewards detail */}
              {failedRewards.length > 0 && (
                <div style={{ marginTop: 10, paddingTop: 10, borderTop: "1px solid var(--border)" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 6 }}>
                    <span style={{ fontSize: 12, fontWeight: 600, color: "#ef4444" }}>
                      失敗エントリー ({failedRewards.length}件)
                    </span>
                    <RetryRewardsButton />
                  </div>
                  <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
                    {failedRewards.map((row) => (
                      <div key={row.id} style={{ fontSize: 11, padding: "4px 0", borderBottom: "1px solid rgba(0,0,0,0.04)" }}>
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                          <span style={{ fontFamily: "monospace", color: "var(--text-primary)" }}>
                            {row.email ? `${row.email.split("@")[0]}@***` : "—"}
                          </span>
                          <span style={{ color: "var(--text-tertiary)", fontSize: 10 }}>
                            {row.submitted_at ? new Date(row.submitted_at).toLocaleString("ja-JP", { timeZone: "Asia/Tokyo", month: "numeric", day: "numeric", hour: "2-digit", minute: "2-digit" }) : "—"}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {surveyLatest.length > 0 && (
              <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                <div style={{ fontSize: 12, color: "var(--text-tertiary)", marginBottom: 2 }}>最新のエントリー</div>
                {surveyLatest.map((row, i) => {
                  const emailPrefix = row.email ? row.email.split("@")[0] : "—"
                  return (
                    <div key={i} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", fontSize: 12, padding: "4px 0", borderBottom: i < surveyLatest.length - 1 ? "1px solid var(--border)" : "none" }}>
                      <div style={{ display: "flex", gap: 6, alignItems: "center", minWidth: 0, flex: 1 }}>
                        <span style={{ fontSize: 11, fontWeight: 600, padding: "2px 6px", borderRadius: 4, background: "rgba(0,49,216,0.08)", color: "#0031D8", flexShrink: 0 }}>{row.survey_id}</span>
                        <span style={{ fontFamily: "monospace", color: "var(--text-primary)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{emailPrefix}@***</span>
                        <RewardBadge status={row.reward_status} />
                      </div>
                      <span style={{ color: "var(--text-tertiary)", fontSize: 11, flexShrink: 0, marginLeft: 4 }}>
                        {row.submitted_at ? new Date(row.submitted_at).toLocaleString("ja-JP", { timeZone: "Asia/Tokyo", month: "numeric", day: "numeric", hour: "2-digit", minute: "2-digit" }) : "—"}
                      </span>
                    </div>
                  )
                })}
              </div>
            )}
          </div>

          {/* Loyalty Summary (cached) */}
          {loyaltyCache && (
            <div className="card animate-in-delay-3" style={{ padding: 20 }}>
              <h2 style={{ fontSize: 15, fontWeight: 600, color: "var(--text-primary)", marginBottom: 12 }}>
                AICUポイント（Loyalty）
                <span style={{ fontSize: 11, fontWeight: 400, color: "var(--text-tertiary)", marginLeft: 8 }}>
                  更新: {new Date(loyaltyCache.updated_at).toLocaleString("ja-JP", { timeZone: "Asia/Tokyo", month: "numeric", day: "numeric", hour: "2-digit", minute: "2-digit" })}
                </span>
              </h2>
              <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                <StatRow label="Loyaltyアカウント数" value={`${loyaltyCache.data.totalAccounts}`} />
                <StatRow label="総発行ポイント" value={`${loyaltyCache.data.totalEarned.toLocaleString()} pt`} />
                <StatRow label="総消費ポイント" value={`${loyaltyCache.data.totalRedeemed.toLocaleString()} pt`} />
                <StatRow label="消費率" value={`${loyaltyCache.data.consumptionRate}%`} highlight />
                <StatRow label="残高合計" value={`${(loyaltyCache.data.totalEarned - loyaltyCache.data.totalRedeemed).toLocaleString()} pt`} />
              </div>
            </div>
          )}

          {/* Recent Logins */}
          <div className="card animate-in-delay-3" style={{ padding: 20 }}>
            <h2 style={{ fontSize: 15, fontWeight: 600, color: "var(--text-primary)", marginBottom: 12 }}>最近のログイン</h2>
            <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
              {recentLogins.length === 0 && (
                <p style={{ fontSize: 13, color: "var(--text-tertiary)" }}>ログインデータなし</p>
              )}
              {recentLogins.map((row: { primary_email: string | null; last_login_at: string | null; wix_contact_id: string | null; discord_id: string | null }, i: number) => (
                <div key={i} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", fontSize: 12, padding: "6px 0", borderBottom: i < recentLogins.length - 1 ? "1px solid var(--border)" : "none" }}>
                  <div style={{ display: "flex", flexDirection: "column", gap: 2, minWidth: 0, flex: 1 }}>
                    <span style={{ color: "var(--text-primary)", fontFamily: "monospace", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                      {row.primary_email ?? "—"}
                    </span>
                    <span style={{ color: "var(--text-tertiary)", fontSize: 11 }}>
                      {row.last_login_at ? new Date(row.last_login_at).toLocaleString("ja-JP", { timeZone: "Asia/Tokyo" }) : "—"}
                    </span>
                  </div>
                  <div style={{ display: "flex", gap: 4, flexShrink: 0, marginLeft: 8 }}>
                    <StatusBadge label="Wix" active={!!row.wix_contact_id} />
                    <StatusBadge label="DC" active={!!row.discord_id} />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Footer */}
      <footer style={{ textAlign: "center", fontSize: 11, color: "var(--text-tertiary)", padding: "16px", display: "flex", flexDirection: "column", gap: 6 }}>
        <div style={{ display: "flex", justifyContent: "center", gap: 12, flexWrap: "wrap" }}>
          <a href="https://corp.aicu.ai/ja/privacy" target="_blank" rel="noopener noreferrer" style={{ color: "var(--text-tertiary)", textDecoration: "none" }}>プライバシーポリシー</a>
          <a href="https://www.aicu.blog/terms/plan-free" target="_blank" rel="noopener noreferrer" style={{ color: "var(--text-tertiary)", textDecoration: "none" }}>利用規約</a>
          <a href="https://www.aicu.blog/terms/legal" target="_blank" rel="noopener noreferrer" style={{ color: "var(--text-tertiary)", textDecoration: "none" }}>法的免責事項</a>
        </div>
        <p>&copy; 2026 AICU Japan 株式会社</p>
      </footer>
    </main>
  )
}

function KpiCard({ label, value, sub }: { label: string; value: string | number; sub?: string }) {
  return (
    <div className="card" style={{ padding: 16 }}>
      <p style={{ fontSize: 12, color: "var(--text-secondary)", marginBottom: 4 }}>{label}</p>
      <p style={{ fontSize: 28, fontWeight: 700, color: "var(--text-primary)", letterSpacing: "-0.02em" }}>
        {value}
      </p>
      {sub && <p style={{ fontSize: 11, color: "var(--text-tertiary)", marginTop: 2 }}>{sub}</p>}
    </div>
  )
}

function StatRow({ label, value, highlight }: { label: string; value: string; highlight?: boolean }) {
  return (
    <div style={{ display: "flex", justifyContent: "space-between", fontSize: 14 }}>
      <span style={{ color: "var(--text-secondary)" }}>{label}</span>
      <span style={{ color: highlight ? "var(--aicu-teal)" : "var(--text-primary)", fontWeight: highlight ? 600 : 400 }}>{value}</span>
    </div>
  )
}

function StatusBadge({ label, active }: { label: string; active: boolean }) {
  return (
    <span style={{
      fontSize: 10,
      fontWeight: 600,
      padding: "2px 6px",
      borderRadius: 4,
      background: active ? "rgba(65, 201, 180, 0.12)" : "rgba(0, 0, 0, 0.04)",
      color: active ? "var(--aicu-teal)" : "var(--text-tertiary)",
    }}>
      {label}
    </span>
  )
}

function RewardBadge({ status }: { status: string | null }) {
  const config: Record<string, { label: string; bg: string; color: string }> = {
    confirmed: { label: "+10K", bg: "rgba(65, 201, 180, 0.12)", color: "var(--aicu-teal)" },
    pending: { label: "処理中", bg: "rgba(245, 158, 11, 0.12)", color: "#f59e0b" },
    failed: { label: "失敗", bg: "rgba(239, 68, 68, 0.12)", color: "#ef4444" },
    none: { label: "匿名", bg: "rgba(0, 0, 0, 0.04)", color: "var(--text-tertiary)" },
  }
  const c = config[status ?? "none"] ?? config.none
  return (
    <span style={{
      fontSize: 9,
      fontWeight: 600,
      padding: "1px 5px",
      borderRadius: 3,
      background: c.bg,
      color: c.color,
      flexShrink: 0,
      whiteSpace: "nowrap",
    }}>
      {c.label}
    </span>
  )
}
