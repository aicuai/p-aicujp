import { NextRequest, NextResponse } from "next/server"
import { verifySupabaseToken, removeSubscription } from "@/lib/push"

export async function POST(req: NextRequest) {
  const userId = await verifySupabaseToken(req.headers.get("authorization"))
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const { endpoint } = await req.json()
  if (!endpoint) {
    return NextResponse.json({ error: "endpoint is required" }, { status: 400 })
  }

  await removeSubscription(endpoint)
  return NextResponse.json({ ok: true })
}
