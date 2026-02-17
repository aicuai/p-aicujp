import { NextRequest, NextResponse } from "next/server"

const GAS_WEBAPP_URL = process.env.GAS_WEBAPP_URL || ""

export async function POST(request: NextRequest) {
  try {
    const { email, token } = await request.json()

    if (!email || !token) {
      return NextResponse.json(
        { success: false, error: "email and token are required" },
        { status: 400 }
      )
    }

    if (!GAS_WEBAPP_URL) {
      return NextResponse.json(
        { success: false, error: "Mail system not configured" },
        { status: 500 }
      )
    }

    const res = await fetch(GAS_WEBAPP_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "unsubscribe", email, token }),
    })

    const data = await res.json()
    return NextResponse.json(data)
  } catch {
    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 }
    )
  }
}
