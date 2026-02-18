import { NextRequest, NextResponse } from "next/server"
import { createServerClient } from "@supabase/ssr"
import { cookies } from "next/headers"
import { SUPERUSER_EMAILS } from "@/lib/constants"
import { getAllMemberEmails } from "@/lib/wix"
import { notifySlackStaff } from "@/lib/slack"

async function getAuthUser() {
  const cookieStore = await cookies()
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll: () => cookieStore.getAll(),
        setAll: () => {},
      },
    },
  )
  const { data: { user } } = await supabase.auth.getUser()
  return user
}

export async function GET(req: NextRequest) {
  const user = await getAuthUser()
  if (!user?.email || !SUPERUSER_EMAILS.includes(user.email)) {
    return NextResponse.json({ error: "unauthorized" }, { status: 403 })
  }

  try {
    const emails = await getAllMemberEmails()
    return NextResponse.json({
      count: emails.length,
      emails,
      fetchedAt: new Date().toISOString(),
    })
  } catch (err) {
    console.error("[admin] getAllMemberEmails error:", err)
    return NextResponse.json({ error: "Failed to fetch Wix emails" }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  const user = await getAuthUser()
  if (!user?.email || !SUPERUSER_EMAILS.includes(user.email)) {
    return NextResponse.json({ error: "unauthorized" }, { status: 403 })
  }

  const body = await req.json()
  const { action } = body

  if (action === "slack") {
    try {
      const emails = await getAllMemberEmails()
      const text =
        `📧 *Wix全会員メールリスト* (${emails.length}件)\n` +
        `取得日時: ${new Date().toLocaleString("ja-JP", { timeZone: "Asia/Tokyo" })}\n\n` +
        emails.join("\n")

      await notifySlackStaff(text)
      return NextResponse.json({ ok: true, count: emails.length })
    } catch (err) {
      console.error("[admin] slack send error:", err)
      return NextResponse.json({ error: "Failed to send to Slack" }, { status: 500 })
    }
  }

  return NextResponse.json({ error: "unknown action" }, { status: 400 })
}
