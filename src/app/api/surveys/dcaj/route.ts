import { NextRequest, NextResponse } from "next/server"
import { getAdminSupabase } from "@/lib/supabase"
import { createHash } from "crypto"

const VALID_DCAJ_SURVEYS = ["dcaj-followup-2026-01"]
const MAX_ANSWERS_SIZE = 50_000

export async function POST(req: NextRequest) {
  const body = await req.json()
  const { surveyId, answers } = body

  if (!surveyId || !answers || typeof answers !== "object" || Array.isArray(answers)) {
    return NextResponse.json(
      { error: "surveyId and answers are required" },
      { status: 400 },
    )
  }

  // Validate survey ID
  if (!VALID_DCAJ_SURVEYS.includes(surveyId)) {
    return NextResponse.json({ error: "invalid survey" }, { status: 400 })
  }

  // Validate answers size
  if (JSON.stringify(answers).length > MAX_ANSWERS_SIZE) {
    return NextResponse.json({ error: "answers too large" }, { status: 400 })
  }

  // Hash IP for dedup (use x-real-ip for Vercel, not spoofable x-forwarded-for)
  const ip = req.headers.get("x-real-ip") || req.headers.get("x-forwarded-for")?.split(",").pop()?.trim() || "unknown"
  const ipHash = createHash("sha256").update(ip).digest("hex").slice(0, 16)

  const db = getAdminSupabase()
  const { error } = await db.from("survey_responses").insert({
    survey_id: surveyId,
    answers,
    submitted_at: new Date().toISOString(),
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
