import { NextRequest, NextResponse } from "next/server"
import { getAdminSupabase } from "@/lib/supabase"

/**
 * POST /api/surveys/beacon
 * Receives progress pings from LiquidGlassForm.
 * Upserts into survey_kv with key="progress".
 *
 * Body: { surveyId, sessionId, step, answeredCount, totalQuestions }
 */
export async function POST(req: NextRequest) {
  const body = await req.json()
  const { surveyId, sessionId, step, answeredCount, totalQuestions } = body

  if (!surveyId || !sessionId || step === undefined) {
    return NextResponse.json({ error: "missing fields" }, { status: 400 })
  }

  // Validate session ID format (UUID v4)
  if (typeof sessionId !== "string" || sessionId.length > 40) {
    return NextResponse.json({ error: "invalid sessionId" }, { status: 400 })
  }

  const db = getAdminSupabase()
  const { error } = await db.from("survey_kv").upsert(
    {
      survey_id: surveyId,
      session_id: sessionId,
      key: "progress",
      value: { step, answeredCount, totalQuestions, ua: req.headers.get("user-agent")?.slice(0, 128) },
      updated_at: new Date().toISOString(),
    },
    { onConflict: "survey_id,session_id,key" },
  )

  if (error) {
    console.error("[beacon] upsert error:", error)
    return NextResponse.json({ error: "save failed" }, { status: 500 })
  }

  return NextResponse.json({ ok: true })
}

// Preflight
export async function OPTIONS() {
  return new NextResponse(null, { status: 204 })
}
