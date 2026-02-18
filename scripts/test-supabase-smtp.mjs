#!/usr/bin/env node
/**
 * Supabase Auth SMTP 設定テスト
 * Usage: node scripts/test-supabase-smtp.mjs [email]
 *
 * テスト内容:
 * 1. Supabase Auth API の疎通確認
 * 2. OTP メール送信テスト（実際にメールが届くか確認）
 * 3. エラーメッセージからSMTP設定状況を推定
 */

import { readFileSync } from "fs"
// Load .env.local manually (no dotenv dependency)
try {
  const envContent = readFileSync(".env.local", "utf-8")
  for (const line of envContent.split("\n")) {
    const match = line.match(/^([^#=]+)=(.*)$/)
    if (match) {
      const key = match[1].trim()
      const val = match[2].trim().replace(/^["']|["']$/g, "")
      if (!process.env[key]) process.env[key] = val
    }
  }
} catch { /* ignore */ }

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL
const ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
const SERVICE_KEY = process.env.SUPABASE_SERVICE_KEY

if (!SUPABASE_URL || !ANON_KEY) {
  console.error("❌ .env.local に NEXT_PUBLIC_SUPABASE_URL / NEXT_PUBLIC_SUPABASE_ANON_KEY が必要です")
  process.exit(1)
}

const projectRef = new URL(SUPABASE_URL).hostname.split(".")[0]
console.log(`\n📋 Supabase プロジェクト: ${projectRef}`)
console.log(`   URL: ${SUPABASE_URL}`)
console.log(`   SMTP設定: https://supabase.com/dashboard/project/${projectRef}/auth/smtp\n`)

// 1. Auth API ヘルスチェック
async function checkHealth() {
  console.log("── 1. Auth API 疎通確認 ──")
  try {
    const start = Date.now()
    const res = await fetch(`${SUPABASE_URL}/auth/v1/settings`, {
      headers: { apikey: ANON_KEY },
    })
    const ms = Date.now() - start
    const data = await res.json()
    if (res.ok) {
      console.log(`   ✅ Auth API 応答OK (${ms}ms)`)
      // Check for SMTP-related settings
      if (data.external) {
        console.log(`   📧 Email 認証: ${data.external.email ? "有効" : "無効"}`)
      }
      if (data.mailer_autoconfirm !== undefined) {
        console.log(`   📧 Auto-confirm: ${data.mailer_autoconfirm ? "ON (確認メール不要)" : "OFF (確認メール必要)"}`)
      }
      return true
    } else {
      console.log(`   ⚠️  Auth API 応答 ${res.status} (${ms}ms): ${JSON.stringify(data)}`)
      return true // API is reachable even if auth required
    }
  } catch (err) {
    console.log(`   ❌ Auth API 接続失敗: ${err.message}`)
    return false
  }
}

// 2. Auth Config (service key required)
async function checkAuthConfig() {
  console.log("\n── 2. Auth 設定確認 (service key) ──")
  if (!SERVICE_KEY) {
    console.log("   ⏭️  SUPABASE_SERVICE_KEY が未設定のためスキップ")
    return
  }
  try {
    // Try the admin auth config endpoint
    const res = await fetch(`${SUPABASE_URL}/auth/v1/admin/config`, {
      headers: {
        apikey: SERVICE_KEY,
        Authorization: `Bearer ${SERVICE_KEY}`,
      },
    })
    if (res.ok) {
      const data = await res.json()
      console.log(`   ✅ Auth Config 取得成功`)
      if (data.SMTP_HOST) {
        console.log(`   📧 カスタムSMTP: ${data.SMTP_HOST}:${data.SMTP_PORT}`)
        console.log(`   📧 SMTP送信元: ${data.SMTP_SENDER_NAME || "(未設定)"}`)
        console.log(`   📧 SMTP Admin Email: ${data.SMTP_ADMIN_EMAIL || "(未設定)"}`)
      } else {
        console.log(`   📧 カスタムSMTP: 未設定 (Supabase デフォルト)`)
      }
    } else {
      const text = await res.text()
      console.log(`   ⚠️  Auth Config: ${res.status} ${text.slice(0, 200)}`)
    }
  } catch (err) {
    console.log(`   ❌ Auth Config 取得失敗: ${err.message}`)
  }
}

// 3. OTP 送信テスト
async function testOtpSend(email) {
  console.log(`\n── 3. OTP メール送信テスト ──`)
  console.log(`   送信先: ${email}`)
  try {
    const start = Date.now()
    const res = await fetch(`${SUPABASE_URL}/auth/v1/otp`, {
      method: "POST",
      headers: {
        apikey: ANON_KEY,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ email }),
    })
    const ms = Date.now() - start
    const data = await res.json().catch(() => ({}))

    if (res.ok) {
      console.log(`   ✅ OTP 送信成功 (${ms}ms)`)
      console.log(`   📬 ${email} の受信箱を確認してください`)
      console.log(`   💡 送信元アドレスでカスタムSMTPが機能しているか確認できます`)
      return true
    } else {
      const code = data.error_code || data.code || res.status
      const msg = data.msg || data.error || data.message || JSON.stringify(data)
      console.log(`   ❌ OTP 送信失敗 (${ms}ms)`)
      console.log(`   エラーコード: ${code}`)
      console.log(`   メッセージ: ${msg}`)

      if (code === "over_email_send_rate_limit" || res.status === 429) {
        console.log(`\n   💡 レートリミット到達。60秒待ってから再実行してください。`)
      } else if (res.status === 504) {
        console.log(`\n   💡 504 タイムアウト。SMTP設定が正しいか確認してください:`)
        console.log(`      https://supabase.com/dashboard/project/${projectRef}/auth/smtp`)
      }
      return false
    }
  } catch (err) {
    console.log(`   ❌ リクエスト失敗: ${err.message}`)
    if (err.message.includes("fetch")) {
      console.log(`   💡 ネットワーク接続を確認してください`)
    }
    return false
  }
}

// Run
const email = process.argv[2] || "aki@aicu.ai"
const healthy = await checkHealth()
if (healthy) {
  await checkAuthConfig()
  await testOtpSend(email)
}

console.log(`\n📌 SMTP設定コンソール: https://supabase.com/dashboard/project/${projectRef}/auth/smtp\n`)
