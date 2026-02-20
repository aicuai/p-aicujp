import { NextRequest, NextResponse } from "next/server"
import { getAdminSupabase } from "@/lib/supabase"

// 1x1 transparent GIF
const PIXEL = Buffer.from(
  "R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7",
  "base64",
)

/**
 * GET /api/mail/open?e=EMAIL&c=CAMPAIGN_ID
 * Tracks email opens via a 1x1 pixel image.
 * Records to survey_kv with key="mail_open".
 */
export async function GET(req: NextRequest) {
  const email = req.nextUrl.searchParams.get("e") || ""
  const campaignId = req.nextUrl.searchParams.get("c") || ""

  if (email && campaignId) {
    try {
      const db = getAdminSupabase()
      await db.from("survey_kv").upsert(
        {
          survey_id: `mail:${campaignId}`,
          session_id: email,
          key: "open",
          value: {
            openedAt: new Date().toISOString(),
            ua: req.headers.get("user-agent")?.slice(0, 128),
          },
          updated_at: new Date().toISOString(),
        },
        { onConflict: "survey_id,session_id,key" },
      )
    } catch (e) {
      console.error("[mail/open] error:", e)
    }
  }

  return new NextResponse(PIXEL, {
    headers: {
      "Content-Type": "image/gif",
      "Cache-Control": "no-store, no-cache, must-revalidate",
    },
  })
}
