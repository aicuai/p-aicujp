import { NextRequest, NextResponse } from "next/server"
import { createHash } from "crypto"
import { getAdminSupabase } from "@/lib/supabase"
import { notifySlack } from "@/lib/slack"

// 有効なカテゴリ
const VALID_CATEGORIES = ["events", "news", "products"] as const
// 有効なイベントコード
const VALID_EVENTS = ["Fes26Halu"] as const

export async function POST(req: NextRequest) {
  try {
    const { email, event, categories, lang, source } = await req.json()

    // --- Validation ---
    if (!email || typeof email !== "string") {
      return NextResponse.json({ error: "email is required" }, { status: 400 })
    }
    const normalizedEmail = email.trim().toLowerCase()
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalizedEmail)) {
      return NextResponse.json({ error: "invalid email format" }, { status: 400 })
    }

    // カテゴリ: デフォルトは events
    const cats: string[] = Array.isArray(categories)
      ? categories.filter((c: string) => VALID_CATEGORIES.includes(c as typeof VALID_CATEGORIES[number]))
      : ["events"]
    if (cats.length === 0) cats.push("events")

    // イベントコード
    const events: string[] = []
    if (event && typeof event === "string" && VALID_EVENTS.includes(event as typeof VALID_EVENTS[number])) {
      events.push(event)
    }

    // 言語
    const subscriberLang = lang === "en" ? "en" : "ja"

    // IP ハッシュ (スパム防止)
    const ip = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim()
      || req.headers.get("x-real-ip")
      || "unknown"
    const ipHash = createHash("sha256").update(ip).digest("hex").slice(0, 16)

    // --- Upsert ---
    const supabase = getAdminSupabase()
    const { data: existing } = await supabase
      .from("mail_subscribers")
      .select("id, events, categories, status")
      .eq("email", normalizedEmail)
      .single()

    if (existing) {
      // 既存: イベント・カテゴリを追加 (配列マージ)、再購読の場合 status を active に
      const mergedEvents = [...new Set([...(existing.events || []), ...events])]
      const mergedCats = [...new Set([...(existing.categories || []), ...cats])]

      const { error } = await supabase
        .from("mail_subscribers")
        .update({
          events: mergedEvents,
          categories: mergedCats,
          lang: subscriberLang,
          status: "active",
          unsubscribed_at: null,
          updated_at: new Date().toISOString(),
        })
        .eq("id", existing.id)

      if (error) {
        console.error("[mail/subscribe] update error:", error)
        return NextResponse.json({ error: "database error" }, { status: 500 })
      }

      return NextResponse.json({
        ok: true,
        action: existing.status === "unsubscribed" ? "resubscribed" : "updated",
        events: mergedEvents,
        categories: mergedCats,
      })
    }

    // 新規登録
    const { error } = await supabase
      .from("mail_subscribers")
      .insert({
        email: normalizedEmail,
        events,
        categories: cats,
        lang: subscriberLang,
        source: source || null,
        ip_hash: ipHash,
      })

    if (error) {
      console.error("[mail/subscribe] insert error:", error)
      return NextResponse.json({ error: "database error" }, { status: 500 })
    }

    // Slack 通知 (非ブロック)
    const eventLabel = events.length > 0 ? ` [${events.join(",")}]` : ""
    notifySlack(`📩 新規メール登録${eventLabel}: ${normalizedEmail} (${subscriberLang}, src:${source || "direct"})`)

    return NextResponse.json({
      ok: true,
      action: "subscribed",
      events,
      categories: cats,
    })
  } catch (err) {
    console.error("[mail/subscribe] error:", err)
    return NextResponse.json({ error: "internal error" }, { status: 500 })
  }
}

export async function OPTIONS() {
  return new NextResponse(null, { status: 204 })
}
