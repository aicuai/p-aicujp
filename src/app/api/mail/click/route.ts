import { NextRequest, NextResponse } from "next/server"
import { getAdminSupabase } from "@/lib/supabase"

/**
 * GET /api/mail/click?e=EMAIL&c=CAMPAIGN_ID&url=TARGET_URL
 * Tracks email link clicks, then redirects to the target URL.
 * Records to survey_kv with key="mail_click".
 */
export async function GET(req: NextRequest) {
  const email = req.nextUrl.searchParams.get("e") || ""
  const campaignId = req.nextUrl.searchParams.get("c") || ""
  const targetUrl = req.nextUrl.searchParams.get("url") || "https://aicu.jp"

  if (email && campaignId) {
    try {
      const db = getAdminSupabase()
      // Append to clicks array (upsert with latest click)
      await db.from("survey_kv").upsert(
        {
          survey_id: `mail:${campaignId}`,
          session_id: email,
          key: "click",
          value: {
            url: targetUrl,
            clickedAt: new Date().toISOString(),
            ua: req.headers.get("user-agent")?.slice(0, 128),
          },
          updated_at: new Date().toISOString(),
        },
        { onConflict: "survey_id,session_id,key" },
      )
    } catch (e) {
      console.error("[mail/click] error:", e)
    }
  }

  // Validate URL to prevent open redirect
  try {
    const parsed = new URL(targetUrl)
    if (!["http:", "https:"].includes(parsed.protocol)) {
      return NextResponse.redirect("https://aicu.jp")
    }
  } catch {
    return NextResponse.redirect("https://aicu.jp")
  }

  return NextResponse.redirect(targetUrl)
}
