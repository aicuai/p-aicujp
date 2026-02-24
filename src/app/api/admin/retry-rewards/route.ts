import { NextRequest, NextResponse } from "next/server"
import { getUser } from "@/lib/auth"
import { SUPERUSER_EMAILS } from "@/lib/constants"
import { getAdminSupabase } from "@/lib/supabase"
import { awardPointsByEmail } from "@/lib/wix"
import { createHash } from "crypto"

export async function POST(req: NextRequest) {
  const user = await getUser()
  if (!user?.email || !SUPERUSER_EMAILS.includes(user.email)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const body = await req.json()
  const { responseId } = body

  const db = getAdminSupabase()

  // If responseId specified, retry single; otherwise retry all failed
  const query = responseId
    ? db.from("survey_responses").select("id, survey_id, email, reward_status").eq("id", responseId).eq("reward_status", "failed")
    : db.from("survey_responses").select("id, survey_id, email, reward_status").eq("reward_status", "failed").neq("is_test", true).not("email", "is", null).order("submitted_at", { ascending: true })

  const { data: rows, error: fetchErr } = await query
  if (fetchErr) {
    return NextResponse.json({ error: fetchErr.message }, { status: 500 })
  }
  if (!rows || rows.length === 0) {
    return NextResponse.json({ message: "No failed rewards to retry", retried: 0 })
  }

  let ok = 0
  let failed = 0
  const results: { id: string; email: string; status: string; error?: string }[] = []

  for (const row of rows) {
    if (!row.email) continue

    const idempotencyKey = createHash("sha256").update(row.email + row.survey_id).digest("hex").slice(0, 16)

    try {
      const result = await awardPointsByEmail(
        row.email,
        10000,
        idempotencyKey,
        `${row.survey_id}調査謝礼`,
      )

      if (result.success) {
        await db.from("survey_responses").update({
          reward_status: "confirmed",
          reward_confirmed_at: new Date().toISOString(),
        }).eq("id", row.id)
        ok++
        results.push({ id: row.id, email: row.email.slice(0, 4) + "***", status: "confirmed" })
      } else {
        failed++
        results.push({ id: row.id, email: row.email.slice(0, 4) + "***", status: "failed", error: result.error })
      }
    } catch (e) {
      const errMsg = e instanceof Error ? e.message : String(e)
      failed++
      results.push({ id: row.id, email: row.email.slice(0, 4) + "***", status: "failed", error: errMsg })
    }

    // Rate limit between Wix API calls
    await new Promise(r => setTimeout(r, 500))
  }

  return NextResponse.json({ retried: rows.length, ok, failed, results })
}
