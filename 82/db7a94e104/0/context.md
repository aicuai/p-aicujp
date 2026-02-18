# Session Context

**Session ID:** 665f2960-9213-4cc9-a019-1106a39e4857

**Commit Message:** SupabaseのSMTPの設定が終わっているかどうかを試すスクリプトって作れますか
？もしくは設定コンソールのURL

## Prompt

supabaseのSMTPの設定が終わっているかどうかを試すスクリプトって作れますか
？もしくは設定コンソールのURL

## Summary

結果：

- **Auth API**: 正常（Email認証有効、Auto-confirm OFF）
- **OTP送信**: レートリミット中（テストしすぎたため）
- **SMTP設定**: Admin API からは取得不可（404）→ ダッシュボードで確認が必要

**設定コンソール**: https://supabase.com/dashboard/project/auyqabzjljmcefymxwgn/auth/smtp

ここで確認できること:
- カスタム SMTP が有効か（Enable Custom SMTP）
- Sender email が `info@aicu.jp` になっているか
- SMTP Host/Port/User/Pass が正しく設定されているか

レートリミットが解除されたら（60秒後）、`node scripts/test-supabase-smtp.mjs aki@aicu.ai` で再テストできます。メールが届けば SMTP は正常です。

## Key Actions

- - **Write**: /Users/aki/git.local/p-aicujp/scripts/test-supabase-smtp.mjs
- - **Bash**: Test Supabase SMTP configuration
- - **Edit**: /Users/aki/git.local/p-aicujp/scripts/test-supabase-smtp.mjs
- - **Bash**: Test Supabase SMTP configuration
