import { NextRequest, NextResponse } from "next/server"
import { getAdminSupabase } from "@/lib/supabase"
import { getLoyaltySummary } from "@/lib/wix"

const CRON_SECRET = process.env.CRON_SECRET

export async function GET(req: NextRequest) {
  // Verify cron secret
  const auth = req.headers.get("authorization")
  if (CRON_SECRET && auth !== `Bearer ${CRON_SECRET}`) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 })
  }

  try {
    const summary = await getLoyaltySummary()

    const db = getAdminSupabase()

    // Ensure admin_cache table exists (upsert is safe even without migration)
    const { error } = await db
      .from("admin_cache")
      .upsert({
        key: "loyalty-summary",
        data: {
          totalAccounts: summary.totalAccounts,
          totalEarned: summary.totalEarned,
          totalRedeemed: summary.totalRedeemed,
          consumptionRate: summary.totalEarned > 0
            ? Math.round((summary.totalRedeemed / summary.totalEarned) * 1000) / 10
            : 0,
          accountDetails: summary.accountDetails.slice(0, 100), // top 100
        },
        updated_at: new Date().toISOString(),
      }, { onConflict: "key" })

    if (error) {
      console.error("[loyalty-cache] upsert error:", error)
      return NextResponse.json({ error: "cache write failed" }, { status: 500 })
    }

    console.log(`[loyalty-cache] Updated: ${summary.totalAccounts} accounts, ${summary.totalEarned} earned, ${summary.totalRedeemed} redeemed`)

    return NextResponse.json({
      ok: true,
      totalAccounts: summary.totalAccounts,
      totalEarned: summary.totalEarned,
      totalRedeemed: summary.totalRedeemed,
    })
  } catch (err) {
    console.error("[loyalty-cache] error:", err)
    return NextResponse.json({ error: "Failed to update loyalty cache" }, { status: 500 })
  }
}
