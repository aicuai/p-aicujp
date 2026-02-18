import { NextRequest, NextResponse } from "next/server"
import { createHmac } from "crypto"

const CHATWOOT_HMAC_TOKEN = process.env.CHATWOOT_HMAC_TOKEN

export async function POST(request: NextRequest) {
  if (!CHATWOOT_HMAC_TOKEN) {
    return NextResponse.json({ error: "hmac not configured" }, { status: 503 })
  }

  let body: { identifier?: string }
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: "invalid json" }, { status: 400 })
  }

  const { identifier } = body
  if (!identifier) {
    return NextResponse.json({ error: "identifier required" }, { status: 400 })
  }

  const identifier_hash = createHmac("sha256", CHATWOOT_HMAC_TOKEN)
    .update(identifier)
    .digest("hex")

  return NextResponse.json({ identifier_hash })
}
