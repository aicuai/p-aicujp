import webPush from "web-push"
import { createClient } from "@supabase/supabase-js"

// VAPID setup
webPush.setVapidDetails(
  "mailto:info@aicu.ai",
  process.env.VAPID_PUBLIC_KEY!,
  process.env.VAPID_PRIVATE_KEY!,
)

// Supabase admin client (service role)
const supabaseAdmin = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_KEY!,
)

/** Verify Supabase JWT and return user_id */
export async function verifySupabaseToken(
  authHeader: string | null,
): Promise<string | null> {
  if (!authHeader?.startsWith("Bearer ")) return null
  const token = authHeader.slice(7)
  const {
    data: { user },
    error,
  } = await supabaseAdmin.auth.getUser(token)
  if (error || !user) return null
  return user.id
}

/** Save push subscription */
export async function saveSubscription(
  userId: string,
  endpoint: string,
  p256dh: string,
  auth: string,
) {
  const { error } = await supabaseAdmin.from("push_subscriptions").upsert(
    {
      user_id: userId,
      endpoint,
      p256dh_key: p256dh,
      auth_key: auth,
    },
    { onConflict: "endpoint" },
  )
  if (error) throw error
}

/** Remove push subscription */
export async function removeSubscription(endpoint: string) {
  const { error } = await supabaseAdmin
    .from("push_subscriptions")
    .delete()
    .eq("endpoint", endpoint)
  if (error) throw error
}

/** Get all subscriptions for a user */
export async function getSubscriptionsByUser(userId: string) {
  const { data, error } = await supabaseAdmin
    .from("push_subscriptions")
    .select("*")
    .eq("user_id", userId)
  if (error) throw error
  return data
}

/** Get all subscriptions */
export async function getAllSubscriptions() {
  const { data, error } = await supabaseAdmin
    .from("push_subscriptions")
    .select("*")
  if (error) throw error
  return data
}

/** Send push notification to a subscription */
export async function sendPush(
  subscription: { endpoint: string; auth_key: string; p256dh_key: string },
  payload: { title: string; body: string; url?: string },
) {
  return webPush.sendNotification(
    {
      endpoint: subscription.endpoint,
      keys: {
        auth: subscription.auth_key,
        p256dh: subscription.p256dh_key,
      },
    },
    JSON.stringify(payload),
  )
}
