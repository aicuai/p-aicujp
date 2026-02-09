"use client"

import { useSearchParams } from "next/navigation"
import { Suspense } from "react"

function ErrorContent() {
  const searchParams = useSearchParams()
  const error = searchParams.get("error")

  const errorMessages: Record<string, string> = {
    Configuration: "サーバー設定エラー: AUTH_SECRET または OAuth 設定を確認してください",
    AccessDenied: "アクセスが拒否されました",
    Verification: "認証リンクの有効期限が切れています",
    OAuthSignin: "Discord OAuth の開始に失敗しました",
    OAuthCallback: "Discord からのコールバックでエラーが発生しました",
    OAuthAccountNotLinked: "このメールアドレスは別のアカウントに紐付いています",
    Default: "認証エラーが発生しました",
  }

  const message = errorMessages[error ?? ""] ?? errorMessages.Default

  return (
    <main className="flex min-h-screen flex-col items-center justify-center px-4">
      <div className="max-w-sm w-full space-y-6 text-center">
        <h1 className="text-2xl font-bold text-white">認証エラー</h1>
        <div className="rounded-xl p-5 bg-red-900/30 border border-red-700">
          <p className="text-sm text-red-300">{message}</p>
          {error && (
            <p className="text-xs text-gray-400 mt-2">Error code: {error}</p>
          )}
        </div>
        <a
          href="/"
          className="inline-block px-6 py-2 bg-aicu-primary hover:bg-aicu-secondary text-white rounded-lg text-sm transition-colors"
        >
          ログインに戻る
        </a>
      </div>
    </main>
  )
}

export default function AuthErrorPage() {
  return (
    <Suspense fallback={<div className="flex min-h-screen items-center justify-center text-white">Loading...</div>}>
      <ErrorContent />
    </Suspense>
  )
}
