import { NextRequest, NextResponse } from "next/server"
import { getAdminSupabase } from "@/lib/supabase"
import { createHash } from "crypto"
import { notifySlackDev } from "@/lib/slack"
import { ALL_SURVEY_IDS } from "@/data/surveys"

const WIX_REWARD_WEBHOOK_URL = process.env.WIX_REWARD_WEBHOOK_URL || ""
const MAX_ANSWERS_SIZE = 50_000 // 50KB JSON limit

// Trigger Wix Automation to create account + award points
async function triggerReward(surveyId: string, email: string, points: number) {
  if (!WIX_REWARD_WEBHOOK_URL || !email) return
  try {
    await fetch(WIX_REWARD_WEBHOOK_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        research_id: surveyId,
        string_data: createHash("sha256").update(email + surveyId).digest("hex").slice(0, 8),
        number_field: points,
        research_name: `${surveyId}調査謝礼`,
        dateTime_field: new Date().toISOString(),
        email_field: email,
      }),
    })
  } catch (e) {
    console.error("Wix reward webhook error:", e)
  }
}

// Extract real client IP (Vercel sets x-real-ip; x-forwarded-for can be spoofed)
function getClientIp(req: NextRequest): string {
  return req.headers.get("x-real-ip") || req.headers.get("x-forwarded-for")?.split(",").pop()?.trim() || "unknown"
}

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id: surveyId } = await params

  // Validate survey ID against whitelist
  if (!ALL_SURVEY_IDS.includes(surveyId)) {
    return NextResponse.json({ error: "invalid survey" }, { status: 400 })
  }

  const body = await req.json()
  const { answers, email } = body

  if (!answers || typeof answers !== "object" || Array.isArray(answers)) {
    return NextResponse.json({ error: "answers are required" }, { status: 400 })
  }

  // Validate answers size to prevent storage abuse
  const answersJson = JSON.stringify(answers)
  if (answersJson.length > MAX_ANSWERS_SIZE) {
    return NextResponse.json({ error: "answers too large" }, { status: 400 })
  }

  // Validate email format if provided
  if (email && (typeof email !== "string" || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email))) {
    return NextResponse.json({ error: "invalid email" }, { status: 400 })
  }

  // Hash IP for dedup (use x-real-ip for Vercel, not spoofable x-forwarded-for)
  const ip = getClientIp(req)
  const ipHash = createHash("sha256").update(ip).digest("hex").slice(0, 16)

  const db = getAdminSupabase()
  const { error } = await db.from("survey_responses").insert({
    survey_id: surveyId,
    answers,
    submitted_at: new Date().toISOString(), // Always use server time
    ip_hash: ipHash,
    user_agent: req.headers.get("user-agent")?.slice(0, 256) ?? null,
    email: email || null,
    reward_status: email ? "pending" : "none",
  })

  if (error) {
    console.error("Survey insert error:", error)
    return NextResponse.json({ error: "Failed to save" }, { status: 500 })
  }

  // Trigger reward (fire-and-forget, don't block response)
  if (email) {
    triggerReward(surveyId, email, 10000).catch(() => {})
  }

  // Slack dev notification (fire-and-forget, hash email for privacy)
  const emailHash = email ? createHash("sha256").update(email).digest("hex").slice(0, 8) : "anon"
  const questionCount = Object.keys(answers).length
  notifySlackDev(
    `[Survey] ${surveyId} 回答保存: ${emailHash} (${questionCount}問)`
  ).catch(() => {})

  return NextResponse.json({ ok: true })
}

// Preflight
export async function OPTIONS() {
  return new NextResponse(null, { status: 204 })
}
