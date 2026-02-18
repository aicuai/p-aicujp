import { NextRequest, NextResponse } from "next/server"
import {
  sendBotMessage,
  setConversationStatus,
  type ChatwootMessageEvent,
  type ChatwootContactEvent,
} from "@/lib/chatwoot"
import { generateResponse } from "@/lib/gemini"
import { notifySlack } from "@/lib/slack"
import { linkChatwootContact } from "@/lib/supabase"

const WEBHOOK_SECRET = process.env.CHATWOOT_WEBHOOK_SECRET

// ─── Message handler (Phase 2: AI auto-response) ───

async function handleMessage(event: ChatwootMessageEvent) {
  // incoming (顧客) メッセージのみ処理、Bot 自身の発言は無視
  if (event.message_type !== "incoming") return
  if (!event.content?.trim()) return

  const conversationId = event.conversation.id

  const { text, shouldEscalate } = await generateResponse(event.content)

  // Bot の回答を送信
  await sendBotMessage(conversationId, text)

  // エスカレーション判定
  if (shouldEscalate) {
    await setConversationStatus(conversationId, "open")
    const senderName = event.sender?.name || "不明"
    await notifySlack(
      `🙋 Chatwoot エスカレーション\n` +
        `顧客: ${senderName}\n` +
        `メッセージ: ${event.content.slice(0, 200)}\n` +
        `→ https://chatwoot.aicu.jp/app/accounts/1/conversations/${conversationId}`,
    )
  }
}

// ─── Contact sync handler (Phase 3: CRM sync) ───

async function handleContactSync(
  event: ChatwootContactEvent,
) {
  // identifier = Supabase Auth UID (setUser で設定される)
  if (!event.identifier) return

  try {
    await linkChatwootContact(event.identifier, event.id)
    console.log(
      `[chatwoot] linked contact ${event.id} → unified_user ${event.identifier}`,
    )
  } catch (err) {
    console.error("[chatwoot] contact sync failed:", err)
  }
}

// ─── Route handler ───

export async function POST(request: NextRequest) {
  // Secret check: prefer header, fall back to query param for backward compat
  if (WEBHOOK_SECRET) {
    const headerSecret = request.headers.get("x-webhook-secret") || ""
    const querySecret = request.nextUrl.searchParams.get("secret") || ""
    if (headerSecret !== WEBHOOK_SECRET && querySecret !== WEBHOOK_SECRET) {
      return NextResponse.json({ error: "unauthorized" }, { status: 401 })
    }
  } else {
    // Fail closed: reject if secret is not configured
    console.error("CHATWOOT_WEBHOOK_SECRET is not configured")
    return NextResponse.json({ error: "server misconfigured" }, { status: 500 })
  }

  let body: Record<string, unknown>
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: "invalid json" }, { status: 400 })
  }

  const event = body.event as string

  try {
    switch (event) {
      case "message_created":
        await handleMessage(body as unknown as ChatwootMessageEvent)
        break
      case "contact_created":
      case "contact_updated":
        await handleContactSync(body as unknown as ChatwootContactEvent)
        break
      default:
        // 未対応イベントは無視
        break
    }
  } catch (err) {
    console.error(`[chatwoot webhook] error handling ${event}:`, err)
    return NextResponse.json({ error: "internal error" }, { status: 500 })
  }

  return NextResponse.json({ ok: true })
}
