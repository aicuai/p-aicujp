import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"
import { notifySlackStaff } from "@/lib/slack"

// Active survey IDs to report — add new campaigns here
const ACTIVE_SURVEYS = ["R2603"]

export async function GET(request: NextRequest) {
  // Vercel Cron Secret 認証
  const authHeader = request.headers.get("authorization")
  const cronSecret = process.env.CRON_SECRET
  if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  try {
    const supabase = createClient(
      process.env.SUPABASE_URL ?? process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_KEY!,
    )

    const since = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString()
    const results: Record<string, { total: number; recent: number; test: number }> = {}

    for (const surveyId of ACTIVE_SURVEYS) {
      const [r1, r2, r3] = await Promise.all([
        supabase
          .from("survey_responses")
          .select("*", { count: "exact", head: true })
          .eq("survey_id", surveyId)
          .neq("is_test", true),
        supabase
          .from("survey_responses")
          .select("*", { count: "exact", head: true })
          .eq("survey_id", surveyId)
          .neq("is_test", true)
          .gte("submitted_at", since),
        supabase
          .from("survey_responses")
          .select("*", { count: "exact", head: true })
          .eq("survey_id", surveyId)
          .eq("is_test", true),
      ])

      if (r1.error) throw r1.error
      if (r2.error) throw r2.error

      results[surveyId] = {
        total: r1.count ?? 0,
        recent: r2.count ?? 0,
        test: r3.count ?? 0,
      }
    }

    const now = new Date().toLocaleString("ja-JP", { timeZone: "Asia/Tokyo" })

    const lines = ["📊 ウィークリーレポート", `━━━━━━━━━━━━━━━━━━`]
    for (const [sid, r] of Object.entries(results)) {
      lines.push(`【${sid}】`)
      lines.push(`  本番回答数: ${r.total} 件`)
      lines.push(`  過去7日新規: +${r.recent} 件`)
      if (r.test) lines.push(`  テスト: ${r.test} 件（除外済み）`)
      lines.push(`  回答ページ: https://p.aicu.jp/q/${sid}`)
    }
    lines.push(`━━━━━━━━━━━━━━━━━━`)
    lines.push(`集計時刻: ${now}`)

    await notifySlackStaff(lines.join("\n"))

    return NextResponse.json({ ok: true, results })
  } catch (error) {
    console.error("[daily-report] error:", error)
    await notifySlackStaff(
      `❌ デイリーレポート失敗\nError: ${error instanceof Error ? error.message : String(error)}`,
    )
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Unknown error" },
      { status: 500 },
    )
  }
}
