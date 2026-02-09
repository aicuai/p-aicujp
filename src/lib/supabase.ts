import { createClient, SupabaseClient } from "@supabase/supabase-js"

let _supabase: SupabaseClient | null = null

function getSupabase() {
  if (!_supabase) {
    _supabase = createClient(
      process.env.SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_KEY!,
    )
  }
  return _supabase
}

export type UnifiedUser = {
  id: string
  discord_id: string
  discord_email: string | null
  discord_username: string | null
  wix_contact_id: string | null
  wix_member_id: string | null
  stripe_customer_id: string | null
  primary_email: string | null
  display_name: string | null
  created_at: string
  updated_at: string
  last_login_at: string | null
}

/** Discord ログイン時に unified_users を UPSERT（なければ作成） */
export async function getOrCreateUser(
  discordId: string,
  email: string | null,
  name: string | null,
) {
  const { data, error } = await getSupabase()
    .from("unified_users")
    .upsert(
      {
        discord_id: discordId,
        discord_email: email,
        discord_username: name,
        primary_email: email,
        display_name: name,
        last_login_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      },
      { onConflict: "discord_id" },
    )
    .select()
    .single()

  if (error) throw error
  return data as UnifiedUser
}

/** Wix の contactId / memberId を unified_users に紐付け */
export async function linkWixContact(
  discordId: string,
  wixContactId: string,
  wixMemberId: string | null,
) {
  const { data, error } = await getSupabase()
    .from("unified_users")
    .update({
      wix_contact_id: wixContactId,
      wix_member_id: wixMemberId,
      updated_at: new Date().toISOString(),
    })
    .eq("discord_id", discordId)
    .select()
    .single()

  if (error) throw error
  return data as UnifiedUser
}

/** Discord ID から unified_user を取得 */
export async function getUserByDiscordId(discordId: string) {
  const { data, error } = await getSupabase()
    .from("unified_users")
    .select()
    .eq("discord_id", discordId)
    .single()

  if (error && error.code !== "PGRST116") throw error
  return (data as UnifiedUser) ?? null
}
