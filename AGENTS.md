# AGENTS.md - p-aicu-ai

## 概要

**Point, Profile, Post** - AICU会員ポータル

- URL: `p.aicu.jp`
- 目的: AICUポイント管理、Discord連携、会員プロフィール

## 機能

### Point（ポイント）
- AICUポイント残高表示
- ポイント履歴表示
- Wix Loyalty API連携

### Profile（プロフィール）
- Discord OAuth認証
- Wix会員との紐付け
- 会員情報表示

### Post（投稿）
- Discord Bot 告知投稿
- スケジュール投稿
- コミュニティ管理

## 技術スタック

| 項目 | 技術 |
|:-----|:-----|
| フレームワーク | Next.js 15 (App Router) |
| 言語 | TypeScript |
| スタイル | Tailwind CSS |
| 認証 | NextAuth.js (Discord Provider) |
| ポイントAPI | Wix Loyalty API |
| 決済API | Stripe API |
| DB | Supabase（紐付けテーブル） |
| ホスティング | Vercel |

## ディレクトリ構成

```
p-aicu-ai/
├── src/
│   ├── app/
│   │   ├── page.tsx              # トップ（ログイン画面）
│   │   ├── dashboard/
│   │   │   ├── page.tsx          # ダッシュボード
│   │   │   ├── points/           # ポイント
│   │   │   └── purchases/        # 購入履歴
│   │   ├── api/
│   │   │   ├── auth/[...nextauth]/  # Discord OAuth
│   │   │   ├── points/           # ポイントAPI
│   │   │   └── webhook/          # Stripe Webhook
│   │   └── layout.tsx
│   ├── components/
│   │   ├── LoginButton.tsx
│   │   ├── PointsCard.tsx
│   │   └── PurchaseHistory.tsx
│   └── lib/
│       ├── wix.ts                # Wix SDK
│       ├── stripe.ts             # Stripe SDK
│       └── auth.ts               # NextAuth設定
├── discord-bot/                  # Discord Bot（将来）
├── AGENTS.md
├── README.md
└── package.json
```

## 環境変数

```env
# Discord OAuth
DISCORD_CLIENT_ID=
DISCORD_CLIENT_SECRET=
NEXTAUTH_SECRET=
NEXTAUTH_URL=https://p.aicu.jp

# Wix
WIX_CLIENT_ID=
WIX_API_KEY=

# Stripe
STRIPE_SECRET_KEY=
STRIPE_WEBHOOK_SECRET=

# Supabase
SUPABASE_URL=
SUPABASE_ANON_KEY=
```

## 開発コマンド

```bash
# 開発サーバー
npm run dev

# ビルド
npm run build

# 本番起動
npm start
```

## 関連リポジトリ

- `japan-corp` - 経営管理
- `aicu-ai` - メインサービス
- `cert.aicu.ai` - 認証サービス

## Issue

- japan-corp#124 - p.aicu.jp プロジェクト
- japan-corp#116 - Wix→Stripe統合移行
