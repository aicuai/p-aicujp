# Session Context

**Session ID:** 0a9df89c-7edf-4220-ad9a-2f459194827c

**Commit Message:** Admin

調査回答は有効件数だけカウントしてください（公開前のダミーは不要)

Loyalityをadminように毎日0時にキャッシュデータ

## Prompt

admin

調査回答は有効件数だけカウントしてください（公開前のダミーは不要)

Loyalityをadminように毎日0時にキャッシュデータを更新してってできる？

---

R2602/results
デフォルトはダミーデータでお願いします！（いま生データが見えている、ログインしているか
ら？)

## Summary

ビルド成功。全変更をまとめます：

**1. Admin - 有効件数のみカウント**
- 全 `survey_responses` クエリに `.neq("is_test", true)` を追加
- テスト/ダミーデータは調査回答数・ポイント付与統計から除外
- 最新エントリー一覧も有効データのみ表示

**2. Loyalty キャッシュ（毎日0時 JST 更新）**
- `supabase/migrations/008_create_admin_cache.sql` — キャッシュテーブル
- `src/lib/wix.ts` — `getLoyaltySummary()` 追加（全取引を集計）
- `src/app/api/cron/loyalty-cache/route.ts` — Vercel Cron（0時 JST = 15:00 UTC）
- `vercel.json` にスケジュール追加
- Admin ダッシュボードに「AICUポイント（Loyalty）」セクション追加
  - Loyaltyアカウント数 / 総発行 / 総消費 / **消費率** / 残高合計

**3. R2602/results - デフォルトはダミーデータ**
- `scrambleForSample()` 関数追加（seeded PRNGで決定論的にデータをシャッフル）
- `myAnswers` がない（=未回答）→ スクランブルされたサンプルデータ + `[Sample Data]` ウォーターマーク
- `myAnswers` がある（=回答済み）→ 実データ + `p.aicu.jp/R2602` ウォーターマーク

> `admin_cache` テーブルはまだ Supabase に作成されていません。デプロイ前に SQL を実行する必要があります。実行しますか？

## Key Actions

- - **Read**: /Users/aki/git.local/p-aicujp/src/app/q/R2602/results/page.tsx
- - **Glob**: src/app/q/R2602/results/**/*
- - **Read**: /Users/aki/git.local/p-aicujp/src/app/q/R2602/results/ResultsClient.tsx
- - **Read**: /Users/aki/git.local/p-aicujp/src/app/api/surveys/R2602/results/route.ts
- - **Edit**: /Users/aki/git.local/p-aicujp/src/app/dashboard/admin/page.tsx
- - **Edit**: /Users/aki/git.local/p-aicujp/src/app/q/R2602/results/ResultsClient.tsx
- - **Edit**: /Users/aki/git.local/p-aicujp/src/app/q/R2602/results/ResultsClient.tsx
- - **Grep**: accounts\.|transactions\.
- - **Read**: /Users/aki/git.local/p-aicujp/src/lib/wix.ts
- - **Bash**: List existing migrations
