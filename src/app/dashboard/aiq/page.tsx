import { getUser } from "@/lib/auth"
import { redirect } from "next/navigation"
import { SUPERUSER_EMAILS } from "@/lib/constants"
import { getAdminSupabase } from "@/lib/supabase"
import Link from "next/link"

// Closed (non-open) survey IDs managed via AIQ dashboard
const AIQ_SURVEY_IDS = ["WS260313"]

type SurveyStats = {
  survey_id: string
  count: number
  latest_at: string | null
}

type ResponseRow = {
  id: string
  survey_id: string
  answers: Record<string, unknown>
  email: string | null
  submitted_at: string
  user_agent: string | null
}

async function getSurveyStats(): Promise<SurveyStats[]> {
  const db = getAdminSupabase()
  const stats: SurveyStats[] = []

  for (const sid of AIQ_SURVEY_IDS) {
    const [countRes, latestRes] = await Promise.all([
      db.from("survey_responses").select("id", { count: "exact", head: true }).eq("survey_id", sid).eq("is_test", false),
      db.from("survey_responses").select("submitted_at").eq("survey_id", sid).eq("is_test", false).order("submitted_at", { ascending: false }).limit(1),
    ])
    stats.push({
      survey_id: sid,
      count: countRes.count ?? 0,
      latest_at: latestRes.data?.[0]?.submitted_at ?? null,
    })
  }
  return stats
}

async function getSurveyResponses(surveyId: string): Promise<ResponseRow[]> {
  const db = getAdminSupabase()
  const { data, error } = await db
    .from("survey_responses")
    .select("id, survey_id, answers, email, submitted_at, user_agent")
    .eq("survey_id", surveyId)
    .eq("is_test", false)
    .order("submitted_at", { ascending: false })
    .limit(100)

  if (error) { console.error("getSurveyResponses:", error); return [] }
  return (data ?? []) as ResponseRow[]
}

// Survey config titles (avoid importing full configs)
const SURVEY_TITLES: Record<string, string> = {
  WS260313: 'さくらインターネット社内勉強会「イマドキのClaude Code ブートキャンプ」',
}

const SURVEY_URLS: Record<string, string> = {
  WS260313: "/q/WS260313",
}

type Props = {
  searchParams: Promise<{ qid?: string }>
}

export default async function AIQDashboard({ searchParams }: Props) {
  const user = await getUser()
  if (!user?.email || !SUPERUSER_EMAILS.includes(user.email)) {
    redirect("/dashboard")
  }

  const { qid } = await searchParams
  const stats = await getSurveyStats()

  // Detail view
  const selectedSurvey = qid && AIQ_SURVEY_IDS.includes(qid) ? qid : null
  const responses = selectedSurvey ? await getSurveyResponses(selectedSurvey) : []

  // Collect all answer keys from responses for table columns
  const answerKeys = selectedSurvey
    ? [...new Set(responses.flatMap((r) => Object.keys(r.answers)))]
    : []

  return (
    <div style={{ maxWidth: 1100, margin: "0 auto", padding: "32px 20px", fontFamily: "system-ui, sans-serif" }}>
      {/* Header */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 32 }}>
        <div>
          <h1 style={{ fontSize: 24, fontWeight: 700, margin: 0 }}>AIQ Dashboard</h1>
          <p style={{ fontSize: 14, color: "#888", margin: "4px 0 0" }}>クローズドアンケート管理</p>
        </div>
        <Link href="/dashboard/admin" style={{ fontSize: 13, color: "#0031D8", textDecoration: "underline" }}>
          Admin Dashboard
        </Link>
      </div>

      {/* Survey list */}
      <div style={{ marginBottom: 32 }}>
        <h2 style={{ fontSize: 16, fontWeight: 600, marginBottom: 12 }}>アンケート一覧</h2>
        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          {stats.map((s) => (
            <Link
              key={s.survey_id}
              href={`/dashboard/aiq?qid=${s.survey_id}`}
              style={{
                display: "flex", alignItems: "center", justifyContent: "space-between",
                padding: "14px 18px", borderRadius: 12,
                background: selectedSurvey === s.survey_id ? "rgba(0,49,216,0.06)" : "#fff",
                border: selectedSurvey === s.survey_id ? "1px solid rgba(0,49,216,0.2)" : "1px solid rgba(0,0,0,0.08)",
                textDecoration: "none", color: "inherit", transition: "all 0.15s",
              }}
            >
              <div>
                <div style={{ fontSize: 14, fontWeight: 600 }}>{SURVEY_TITLES[s.survey_id] || s.survey_id}</div>
                <div style={{ fontSize: 12, color: "#999", marginTop: 2 }}>
                  ID: {s.survey_id}
                  {" | "}
                  <a href={SURVEY_URLS[s.survey_id] || `/q/${s.survey_id}`} target="_blank" rel="noopener" style={{ color: "#0031D8" }}>
                    フォーム
                  </a>
                </div>
              </div>
              <div style={{ textAlign: "right" }}>
                <div style={{ fontSize: 22, fontWeight: 700, color: "#0031D8" }}>{s.count}</div>
                <div style={{ fontSize: 11, color: "#999" }}>
                  {s.latest_at
                    ? `最終: ${new Date(s.latest_at).toLocaleDateString("ja-JP", { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" })}`
                    : "回答なし"
                  }
                </div>
              </div>
            </Link>
          ))}
        </div>
      </div>

      {/* Detail view */}
      {selectedSurvey && (
        <div>
          <h2 style={{ fontSize: 16, fontWeight: 600, marginBottom: 4 }}>
            {SURVEY_TITLES[selectedSurvey] || selectedSurvey}
          </h2>
          <p style={{ fontSize: 13, color: "#888", marginBottom: 16 }}>
            {responses.length}件の回答
          </p>

          {responses.length === 0 ? (
            <p style={{ color: "#999", fontSize: 14 }}>まだ回答がありません。</p>
          ) : (
            <div style={{ overflowX: "auto" }}>
              <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
                <thead>
                  <tr style={{ borderBottom: "2px solid #eee" }}>
                    <th style={thStyle}>#</th>
                    <th style={thStyle}>日時</th>
                    <th style={thStyle}>メール</th>
                    {answerKeys.map((k) => (
                      <th key={k} style={thStyle}>{friendlyLabel(k)}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {responses.map((r, i) => (
                    <tr key={r.id} style={{ borderBottom: "1px solid #f0f0f0" }}>
                      <td style={tdStyle}>{responses.length - i}</td>
                      <td style={tdStyle}>
                        {new Date(r.submitted_at).toLocaleDateString("ja-JP", {
                          month: "short", day: "numeric", hour: "2-digit", minute: "2-digit",
                        })}
                      </td>
                      <td style={tdStyle}>{r.email || "—"}</td>
                      {answerKeys.map((k) => (
                        <td key={k} style={tdStyle}>
                          {formatAnswer(r.answers[k])}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

function friendlyLabel(key: string): string {
  const map: Record<string, string> = {
    ws_recommend: "おすすめ",
    ws_again: "再参加",
    ws_challenges: "課題",
    ws_want_to_know: "知りたいこと",
    ws_work_url: "作品URL",
    ws_email: "メール",
  }
  return map[key] || key
}

function formatAnswer(val: unknown): string {
  if (val === null || val === undefined) return "—"
  if (Array.isArray(val)) return val.join(", ")
  if (typeof val === "string" && val.length > 80) return val.slice(0, 80) + "…"
  return String(val)
}

const thStyle: React.CSSProperties = {
  textAlign: "left", padding: "8px 10px", fontWeight: 600, color: "#666",
  whiteSpace: "nowrap", fontSize: 12,
}

const tdStyle: React.CSSProperties = {
  padding: "8px 10px", verticalAlign: "top", maxWidth: 200,
  wordBreak: "break-word",
}
