import { NextRequest, NextResponse } from "next/server"
import { getAdminSupabase } from "@/lib/supabase"

export async function POST(req: NextRequest) {
  try {
    const { email, token } = await req.json()

    if (!token || typeof token !== "string") {
      return NextResponse.json({ error: "token is required" }, { status: 400 })
    }

    const supabase = getAdminSupabase()

    // トークンで購読者を検索
    const { data: subscriber, error: findError } = await supabase
      .from("mail_subscribers")
      .select("id, email, status")
      .eq("unsub_token", token)
      .single()

    if (findError || !subscriber) {
      return NextResponse.json({ error: "invalid token" }, { status: 404 })
    }

    // email が指定されている場合は一致確認
    if (email && subscriber.email !== email.trim().toLowerCase()) {
      return NextResponse.json({ error: "email mismatch" }, { status: 400 })
    }

    if (subscriber.status === "unsubscribed") {
      return NextResponse.json({ ok: true, action: "already_unsubscribed" })
    }

    const { error } = await supabase
      .from("mail_subscribers")
      .update({
        status: "unsubscribed",
        unsubscribed_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .eq("id", subscriber.id)

    if (error) {
      console.error("[mail/unsubscribe] error:", error)
      return NextResponse.json({ error: "database error" }, { status: 500 })
    }

    return NextResponse.json({ ok: true, action: "unsubscribed" })
  } catch (err) {
    console.error("[mail/unsubscribe] error:", err)
    return NextResponse.json({ error: "internal error" }, { status: 500 })
  }
}

export async function OPTIONS() {
  return new NextResponse(null, { status: 204 })
}
