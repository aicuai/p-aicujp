import { NextRequest, NextResponse } from "next/server"
import { getAdminSupabase } from "@/lib/supabase"
import { createHash } from "crypto"

export async function POST(req: NextRequest) {
  const body = await req.json()
  const { surveyId, answers, submittedAt } = body

  if (!surveyId || !answers || typeof answers !== "object") {
    return NextResponse.json(
      { error: "surveyId and answers are required" },
      { status: 400 },
    )
  }

  // Hash IP for dedup (never store raw IP)
  const forwarded = req.headers.get("x-forwarded-for")
  const ip = forwarded?.split(",")[0]?.trim() ?? "unknown"
  const ipHash = createHash("sha256").update(ip).digest("hex").slice(0, 16)

  const db = getAdminSupabase()
  const { error } = await db.from("survey_responses").insert({
    survey_id: surveyId,
    answers,
    submitted_at: submittedAt || new Date().toISOString(),
    ip_hash: ipHash,
    user_agent: req.headers.get("user-agent")?.slice(0, 256) ?? null,
  })

  if (error) {
    console.error("Survey insert error:", error)
    return NextResponse.json({ error: "Failed to save" }, { status: 500 })
  }

  return NextResponse.json({ ok: true })
}

// Preflight
export async function OPTIONS() {
  return new NextResponse(null, { status: 204 })
}
