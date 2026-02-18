// Chatwoot API client for Agent Bot integration

const CHATWOOT_BASE_URL = process.env.CHATWOOT_BASE_URL!
const CHATWOOT_BOT_TOKEN = process.env.CHATWOOT_BOT_TOKEN!
const CHATWOOT_ACCOUNT_ID = process.env.CHATWOOT_ACCOUNT_ID || "1"

// ─── Types ───

export type ChatwootMessageEvent = {
  event: "message_created" | "message_updated"
  id: number
  content: string
  message_type: "incoming" | "outgoing" | "activity" | "template"
  content_type: "text" | "input_select" | "cards" | "form"
  conversation: {
    id: number
    status: "open" | "resolved" | "pending" | "snoozed"
    contact_inbox: {
      contact_id: number
      inbox_id: number
    }
  }
  sender?: {
    id: number
    type: "contact" | "user" | "agent_bot"
    name?: string
    email?: string
  }
  account: { id: number }
}

export type ChatwootContactEvent = {
  event: "contact_created" | "contact_updated"
  id: number
  name?: string
  email?: string
  phone_number?: string
  identifier?: string // setUser() で設定した外部 ID
  custom_attributes?: Record<string, unknown>
  account: { id: number }
}

// ─── API ───

async function chatwootAPI(path: string, body: Record<string, unknown>) {
  const url = `${CHATWOOT_BASE_URL}/api/v1/accounts/${CHATWOOT_ACCOUNT_ID}${path}`
  const res = await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      api_access_token: CHATWOOT_BOT_TOKEN,
    },
    body: JSON.stringify(body),
  })
  if (!res.ok) {
    const text = await res.text()
    console.error(`[chatwoot] API error ${res.status}: ${text}`)
  }
  return res
}

/** Bot としてメッセージを送信 */
export async function sendBotMessage(conversationId: number, content: string) {
  return chatwootAPI(`/conversations/${conversationId}/messages`, {
    content,
    message_type: "outgoing",
  })
}

/** 会話ステータスを変更（人間エスカレーション時に "open" に） */
export async function setConversationStatus(
  conversationId: number,
  status: "open" | "resolved" | "pending" | "snoozed",
) {
  const url = `${CHATWOOT_BASE_URL}/api/v1/accounts/${CHATWOOT_ACCOUNT_ID}/conversations/${conversationId}/toggle_status`
  const res = await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      api_access_token: CHATWOOT_BOT_TOKEN,
    },
    body: JSON.stringify({ status }),
  })
  if (!res.ok) {
    console.error(`[chatwoot] toggle_status error: ${res.status}`)
  }
  return res
}
