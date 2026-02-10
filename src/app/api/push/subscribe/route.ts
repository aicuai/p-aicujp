import { NextRequest, NextResponse } from "next/server"
import { verifySupabaseToken, saveSubscription } from "@/lib/push"

export async function POST(req: NextRequest) {
  const userId = await verifySupabaseToken(req.headers.get("authorization"))
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const { endpoint, p256dh, auth } = await req.json()
  if (!endpoint || !p256dh || !auth) {
    return NextResponse.json(
      { error: "endpoint, p256dh, auth are required" },
      { status: 400 },
    )
  }

  await saveSubscription(userId, endpoint, p256dh, auth)
  return NextResponse.json({ ok: true })
}
