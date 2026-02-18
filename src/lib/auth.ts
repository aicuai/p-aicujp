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
    const status = (error as unknown as Record<string, unknown>).status as number | undefined
    // Supabase AuthRetryableFetchError returns message="{}" on timeout
    if (error.name === "AuthRetryableFetchError" || status === 504) {
      return { error: "認証サーバーに接続できませんでした。しばらく待ってから再度お試しください。" }
    }
    if (status === 429) {
      return { error: "送信回数の制限に達しました。しばらく待ってから再度お試しください。" }
    }
    // Fallback: ignore "{}" or empty messages
    const msg = error.message && error.message !== "{}" ? error.message : "認証エラーが発生しました"
    return { error: msg }
  }

  return { success: true as const }
}

/** サーバーアクション: サインアウト */
export async function signOut() {
  const supabase = await createServerSupabase()
  await supabase.auth.signOut()
  redirect("/")
}
