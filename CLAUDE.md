# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

**p-aicujp** — AICU会員ポータル (Point, Profile, Post) at `p.aicu.jp`

3つのコア機能 (3P):
- **Point** (最優先): AICUポイント残高・履歴 — Wix Loyalty API連携
- **Profile** (Phase 2): Discord OAuth認証、Wix会員紐付け、Stripe決済状態
- **Post** (Phase 3): Discord Bot告知・スケジュール投稿

詳細な開発経緯・CEO判断・設計方針は `docs/DEVELOPMENT_CONTEXT.md` を参照。

## Commands

```bash
npm run dev      # 開発サーバー (localhost:3200)
npm run build    # プロダクションビルド
npm start        # プロダクションサーバー起動
npm run lint     # ESLint (next lint)
```

No test framework is configured yet.

## Tech Stack

- **Next.js 15** (App Router) + **React 19** + **TypeScript** (strict mode)
- **Tailwind CSS 3.4** with custom AICU color tokens
- **NextAuth.js 5 beta** (`next-auth@5.0.0-beta.30`, Discord Provider)
- **@aicujp/ui** — Custom UI component library (Liquid Glass design system)
- **Wix SDK** (@wix/sdk, @wix/members, @wix/loyalty) — API Key auth (not OAuth)
- **Stripe** for payments and webhooks
- **Supabase** for Discord↔Wix user linking
- Deployed on **Vercel**

## Architecture

### Auth Flow

```
NextAuth middleware (src/middleware.ts) protects /dashboard/* only
  → Unauthenticated users redirected to / (login page)
  → Discord OAuth via NextAuth
  → Session available server-side via auth() from src/lib/auth.ts
  → signIn/signOut exported as Server Actions
```

NextAuth is configured with the v5 `authorized` callback pattern — `src/lib/auth.ts` exports `{ handlers, auth, signIn, signOut }`.

### Integration Flow (Target)

```
User → Discord OAuth (NextAuth) → Dashboard
  ├── Points: Session → Supabase (Discord↔Wix mapping) → Wix Loyalty API
  ├── Purchases: Stripe API → purchase history
  └── Profile: Discord user info + Wix member data
```

Supabase acts as a mapping layer (not a monolithic DB). Schema includes `unified_users` and `bonus_points` tables.

### Current Implementation Status

Implemented:
- `src/app/page.tsx` — Login page (Liquid Glass glassmorphism UI)
- `src/app/dashboard/page.tsx` — Dashboard (points card placeholder, profile, membership)
- `src/app/dashboard/DashboardNav.tsx` — Bottom nav using `LiquidGlassNav` from @aicujp/ui
- `src/app/dashboard/SignOutButton.tsx` — Client-side logout
- `src/app/api/auth/[...nextauth]/route.ts` — OAuth handler
- `src/components/Providers.tsx` — SessionProvider wrapper
- `src/lib/auth.ts` — NextAuth config
- `src/middleware.ts` — Route protection

Not yet implemented:
- `src/lib/wix.ts`, `src/lib/stripe.ts` (SDK wrappers)
- `src/app/dashboard/points/`, `src/app/dashboard/purchases/` (sub-pages)
- `src/app/api/points/`, `src/app/api/webhook/` (API routes)
- `discord-bot/` (Phase 3)

## Environment Variables

Copy `.env.example` to `.env.local`. Key variables:
- `DISCORD_CLIENT_ID` / `DISCORD_CLIENT_SECRET` — Discord OAuth
- `AUTH_SECRET` / `AUTH_TRUST_HOST` — NextAuth v5 config (not NEXTAUTH_SECRET)
- `WIX_API_KEY` / `WIX_SITE_ID` / `WIX_ACCOUNT_ID` — Wix API Key auth
- `STRIPE_SECRET_KEY` / `STRIPE_PUBLISHABLE_KEY` / `STRIPE_WEBHOOK_SECRET`
- `SUPABASE_URL` / `SUPABASE_ANON_KEY` / `SUPABASE_SERVICE_KEY`

## Conventions

- Path alias: `@/*` maps to `./src/*`
- UI language: Japanese (`html lang="ja"`)
- Dark theme: `bg-gray-950` background, white text, gradient body via CSS custom properties
- Tailwind custom colors: `aicu-primary` (#6366f1), `aicu-secondary` (#8b5cf6), `aicu-accent` (#f59e0b), Discord blue (#5865F2)
- Liquid Glass design system: CSS variables from `@aicujp/ui/styles` (`--glass-bg`, `--glass-border`, `--glass-blur`, etc.)
- Server Components by default; `"use client"` only for interactivity (SessionProvider, nav, sign-out)
- `next.config.ts`: `transpilePackages: ["@aicujp/ui"]`, Discord CDN images allowed
- Naming: `-aicujp` suffix / `.jp` domain for Japan-specific services

## Related Repositories

- `japan-corp` — 経営管理 (Issue #124: p.aicu.jp, #116: Wix→Stripe移行)
- `aicu-ai` — メインサービス
- `cert.aicu.ai` — 認証サービス
