"use server"

import { createServerSupabase } from "@/lib/supabase"
import { redirect } from "next/navigation"
import { headers } from "next/headers"

export type SignInResult = { error: string } | { success: true } | null

/** サーバーコンポーネント用: 認証ユーザー取得 */
export async function getUser() {
  const supabase = await createServerSupabase()
  const { data: { user } } = await supabase.auth.getUser()
  return user
}

/** サーバーアクション: メールマジックリンクでログイン */
export async function signInWithEmail(formData: FormData) {
  const email = formData.get("email") as string
  if (!email) return { error: "メールアドレスを入力してください" }

  const supabase = await createServerSupabase()

  // リクエスト元のドメインに合わせてリダイレクト先を決定
  const h = await headers()
  const origin = h.get("origin") || h.get("referer")
  const siteUrl = origin ? new URL(origin).origin : (process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3200")
  const { error } = await supabase.auth.signInWithOtp({
    email,
    options: {
      emailRedirectTo: `${siteUrl}/auth/callback`,
    },
  })

  if (error) {
    return { error: error.message }
  }

  return { success: true as const }
}

/** サーバーアクション: サインアウト */
export async function signOut() {
  const supabase = await createServerSupabase()
  await supabase.auth.signOut()
  redirect("/")
}
