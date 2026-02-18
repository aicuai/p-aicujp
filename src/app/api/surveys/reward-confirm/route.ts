import { NextRequest, NextResponse } from "next/server"
import { getAdminSupabase } from "@/lib/supabase"
import { timingSafeEqual } from "crypto"

const CALLBACK_SECRET = process.env.WIX_CALLBACK_SECRET || ""

function safeCompare(a: string, b: string): boolean {
  if (!a || !b || a.length !== b.length) return false
  return timingSafeEqual(Buffer.from(a), Buffer.from(b))
}

/**
 * POST /api/surveys/reward-confirm
 *
 * Called by Wix Automation after reward (AICU points) is distributed.
 * Updates survey_responses.reward_status = 'confirmed'.
 */
export async function POST(req: NextRequest) {
  // Auth: require secret always (fail if env var is unset)
  if (!CALLBACK_SECRET) {
    console.error("WIX_CALLBACK_SECRET is not configured")
    return NextResponse.json({ error: "server misconfigured" }, { status: 500 })
  }

  const body = await req.json()
  const { email, research_id, points, status, secret } = body

  const headerSecret = req.headers.get("x-callback-secret") || ""
  if (!safeCompare(secret || "", CALLBACK_SECRET) && !safeCompare(headerSecret, CALLBACK_SECRET)) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 })
  }

  if (!email || !research_id) {
    return NextResponse.json({ error: "email and research_id required" }, { status: 400 })
  }

  const rewardStatus = status === "failed" ? "failed" : "confirmed"
  const db = getAdminSupabase()

  // Find the most recent survey response for this email + survey
  const { data: rows, error: findErr } = await db
    .from("survey_responses")
    .select("id, reward_status")
    .eq("survey_id", research_id)
    .eq("email", email)
    .order("submitted_at", { ascending: false })
    .limit(1)

  if (findErr || !rows || rows.length === 0) {
    console.error("Reward confirm - not found:", { email, research_id, findErr })
    return NextResponse.json({ error: "response not found" }, { status: 404 })
  }

  const row = rows[0]

  // Update reward status
  const { error: updateErr } = await db
    .from("survey_responses")
    .update({
      reward_status: rewardStatus,
      reward_confirmed_at: new Date().toISOString(),
    })
    .eq("id", row.id)

  if (updateErr) {
    console.error("Reward confirm update error:", updateErr)
    return NextResponse.json({ error: "update failed" }, { status: 500 })
  }

  console.log(`Reward ${rewardStatus}: ${email} / ${research_id} / ${points}pt`)
  return NextResponse.json({
    ok: true,
    reward_status: rewardStatus,
    survey_response_id: row.id,
  })
}

// Preflight
export async function OPTIONS() {
  return new NextResponse(null, { status: 204 })
}
