import { NextRequest, NextResponse } from "next/server"
import { createHash } from "crypto"
import { getAdminSupabase } from "@/lib/supabase"

const VALID_ACTIONS = ["like", "want_video", "share"] as const

/**
 * GET /api/event/react?event=Fes26Halu
 * → 全セッションの集計カウントを返す
 */
export async function GET(req: NextRequest) {
  const eventCode = req.nextUrl.searchParams.get("event")
  if (!eventCode) {
    return NextResponse.json({ error: "event parameter required" }, { status: 400 })
  }

  try {
    const supabase = getAdminSupabase()
    const { data, error } = await supabase
      .from("event_reactions")
      .select("session_id, action")
      .eq("event_code", eventCode)

    if (error) {
      console.error("[event/react] GET error:", error)
      return NextResponse.json({ error: "database error" }, { status: 500 })
    }

    // 集計: { keynote: { like: 5, want_video: 3, share: 1 }, ... }
    const counts: Record<string, Record<string, number>> = {}
    for (const row of data || []) {
      if (!counts[row.session_id]) counts[row.session_id] = {}
      counts[row.session_id][row.action] = (counts[row.session_id][row.action] || 0) + 1
    }

    return NextResponse.json({ ok: true, event: eventCode, counts })
  } catch (err) {
    console.error("[event/react] GET error:", err)
    return NextResponse.json({ error: "internal error" }, { status: 500 })
  }
}

/**
 * POST /api/event/react
 * body: { event: "Fes26Halu", session: "keynote", action: "like" }
 * → IP dedup で1票追加、最新カウントを返す
 */
export async function POST(req: NextRequest) {
  try {
    const { event, session, action } = await req.json()

    if (!event || !session || !action) {
      return NextResponse.json({ error: "event, session, action required" }, { status: 400 })
    }
    if (!VALID_ACTIONS.includes(action)) {
      return NextResponse.json({ error: "invalid action" }, { status: 400 })
    }

    // IP ハッシュ
    const ip = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim()
      || req.headers.get("x-real-ip")
      || "unknown"
    const ipHash = createHash("sha256").update(ip).digest("hex").slice(0, 16)

    const supabase = getAdminSupabase()

    // Upsert (重複は UNIQUE 制約で無視)
    const { error: insertError } = await supabase
      .from("event_reactions")
      .upsert(
        {
          event_code: event,
          session_id: session,
          action,
          ip_hash: ipHash,
        },
        { onConflict: "event_code,session_id,action,ip_hash", ignoreDuplicates: true }
      )

    if (insertError) {
      console.error("[event/react] POST error:", insertError)
      return NextResponse.json({ error: "database error" }, { status: 500 })
    }

    // このセッションの最新カウントを返す
    const { data: countData } = await supabase
      .from("event_reactions")
      .select("action")
      .eq("event_code", event)
      .eq("session_id", session)

    const sessionCounts: Record<string, number> = {}
    for (const row of countData || []) {
      sessionCounts[row.action] = (sessionCounts[row.action] || 0) + 1
    }

    return NextResponse.json({ ok: true, session, counts: sessionCounts })
  } catch (err) {
    console.error("[event/react] POST error:", err)
    return NextResponse.json({ error: "internal error" }, { status: 500 })
  }
}

export async function OPTIONS() {
  return new NextResponse(null, { status: 204 })
}
